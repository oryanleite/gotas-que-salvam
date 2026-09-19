"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { ArrowRight, CalendarCheck, Check, CheckCircle2, CircleAlert, Clock3, ExternalLink, Flag, HeartHandshake, Info, Landmark, LocateFixed, Map as MapIcon, MapPin, Menu, Navigation, Phone, Scale, Search, Share2, ShieldCheck, Sparkles, Stethoscope, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PUBLIC_DONATION_CENTERS, type DonationCenter } from "@/lib/donation-centers";
import { LOCATION_REFERENCES, type LocationReference } from "@/lib/locations";
import { calculateDistance, filterCenters, findLocationSuggestions, formatDistance, isOpenNow, normalizeCep, normalizeText } from "@/lib/domain.mjs";
import { getRouteDistance, formatRouteDuration, type RouteInfo } from "@/lib/route-distance";
import { SITE_WHATSAPP_NUMBER } from "@/lib/donation-counter";
import HeroDonationCounter from "@/components/hero-donation-counter";

const DonationLeafletMap = dynamic(() => import("@/components/donation-leaflet-map"), {
  ssr: false,
  loading: () => <div className="map-loading"><MapIcon/>Carregando mapa...</div>,
});

// Número de WhatsApp para onde os reports de "informação desatualizada" e
// as confirmações de doação são direcionados (edite em lib/donation-counter.ts).
const REPORT_WHATSAPP_NUMBER = SITE_WHATSAPP_NUMBER;
// Quantidade de locais mais próximos para os quais calculamos a rota real
// (evita disparar dezenas de chamadas ao serviço de rotas de uma vez).
const ROUTE_LOOKUP_LIMIT = 8;

type PositionReference = { latitude:number; longitude:number; label:string; neighborhood?:string; source:"gps"|"manual"|"cep" };
type CenterWithDistance = DonationCenter & { distance:number|null };
type LocationStatus = "idle"|"requesting"|"ready"|"denied"|"unavailable";
const typeLabel={hemocentro:"Hemocentro",banco_sangue:"Banco de sangue",posto_coleta:"Posto de coleta",hospital_com_coleta:"Hospital com coleta"} as const;
const managementLabel={publico:"Público",privado:"Privado",filantropico:"Filantrópico"} as const;

function referenceKey(reference: PositionReference): string {
  return `${reference.latitude.toFixed(4)},${reference.longitude.toFixed(4)}`;
}

function buildShareMessage(center: DonationCenter): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gotas-que-salvam.vercel.app";
  const lines = [
    `📍 ${center.name}`,
    center.fullAddress,
    center.donation.openingHours ? `Horário: ${center.donation.openingHours}` : null,
    "",
    "Encontrado no Gotas que Salvam — locais para doar sangue na Grande São Paulo:",
    `${siteUrl}/#onde-doar`,
  ].filter(Boolean);
  return (lines as string[]).join("\n");
}

async function shareCenter(center: DonationCenter) {
  const text = buildShareMessage(center);
  const nav = typeof navigator !== "undefined" ? navigator : null;
  if (nav?.share) {
    try {
      await nav.share({ title: center.name, text });
      return;
    } catch {
      // Usuário cancelou o compartilhamento nativo ou o navegador não deu
      // suporte de fato — cai para o link do WhatsApp abaixo.
    }
  }
  if (nav?.clipboard) {
    try { await nav.clipboard.writeText(text); } catch { /* clipboard indisponível, segue sem copiar */ }
  }
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const link = document.createElement("a");
  link.href = waUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.click();
  toast.success("Texto copiado! Abrindo o WhatsApp para você escolher com quem compartilhar.");
}

function ShareButton({ center }: { center: DonationCenter }) {
  return (
    <button
      type="button"
      className="icon-action"
      title="Compartilhar este local"
      aria-label={`Compartilhar ${center.name}`}
      onClick={(e) => { e.stopPropagation(); void shareCenter(center); }}
    >
      <Share2/>
    </button>
  );
}

function ReportButton({ center, onReport }: { center: DonationCenter; onReport: (center: DonationCenter) => void }) {
  return (
    <button
      type="button"
      className="icon-action"
      title="Informação desatualizada?"
      aria-label={`Reportar informação desatualizada sobre ${center.name}`}
      onClick={(e) => { e.stopPropagation(); onReport(center); }}
    >
      <Flag/>
    </button>
  );
}

function ReportDialog({ center, open, onOpenChange }: { center: DonationCenter | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [note, setNote] = useState("");
  const whatsappUrl = center
    ? `https://wa.me/${REPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
        `Olá! Quero reportar uma informação desatualizada no site Gotas que Salvam.\n\nLocal: ${center.name}\nEndereço: ${center.fullAddress}${
          note.trim() ? `\n\nO que mudou: ${note.trim()}` : "\n\nO que mudou: (não especificado, favor detalhar)"
        }`
      )}`
    : "#";
  if (!center) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="report-dialog">
        <DialogHeader>
          <DialogTitle>Informação desatualizada?</DialogTitle>
          <DialogDescription>
            Conte o que mudou em <strong>{center.name}</strong>. Vamos abrir uma conversa no WhatsApp com a mensagem já preenchida — é só confirmar o envio.
          </DialogDescription>
        </DialogHeader>
        <textarea
          className="report-textarea"
          placeholder="Ex.: o horário mudou, o telefone não existe mais, o local fechou..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
        />
        <div className="details-actions">
          <button type="button" className="secondary" onClick={() => onOpenChange(false)}>Cancelar</button>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => { onOpenChange(false); setNote(""); }}>Abrir WhatsApp<ExternalLink/></a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Logo(){return <span className="logo-lockup" aria-label="Gotas que Salvam"><span className="logo-mark" aria-hidden="true"><span className="logo-scale"><i/><b/><i/></span></span><span className="logo-type"><strong>Gotas</strong><small>que salvam</small></span></span>}

function Header(){const[open,setOpen]=useState(false);const links=[["Onde doar","#onde-doar"],["Como funciona","#como-funciona"],["Posso doar?","#posso-doar"],["Antes de ir","#antes-de-ir"],["Sobre","#sobre"]];return <header className="site-header"><div className="shell header-inner"><a href="#inicio" className="brand-link"><Logo/></a><nav className="desktop-nav" aria-label="Navegação principal">{links.map(([l,h])=><a key={h} href={h}>{l}</a>)}<a href="/privacidade">Privacidade</a></nav><a className="header-cta" href="#busca">Encontrar onde doar <ArrowRight size={16}/></a><button className="menu-button" onClick={()=>setOpen(!open)} aria-expanded={open} aria-label="Abrir menu">{open?<X/>:<Menu/>}</button></div>{open&&<nav className="mobile-nav">{links.map(([l,h])=><a key={h} href={h} onClick={()=>setOpen(false)}>{l}</a>)}</nav>}</header>}

function LocationSearch({onSelect,onGps,status,setStatus}: {onSelect:(r:PositionReference)=>void;onGps:()=>void;status:LocationStatus;setStatus:(s:LocationStatus)=>void}){
  const[query,setQuery]=useState("");const[error,setError]=useState("");const[loading,setLoading]=useState(false);
  const suggestions=useMemo(()=>findLocationSuggestions(LOCATION_REFERENCES,query,7),[query]);
  const choose=(location:LocationReference,source:"manual"|"cep"="manual")=>{setQuery(location.label);setError("");onSelect({latitude:location.latitude,longitude:location.longitude,label:location.label,neighborhood:location.kind==="bairro"?location.neighborhood:undefined,source});};
  const search=async()=>{const cep=normalizeCep(query);if(cep){setLoading(true);setError("");try{const response=await fetch(`https://viacep.com.br/ws/${cep}/json/`);if(!response.ok)throw new Error();const data=await response.json() as {erro?:boolean;bairro?:string;localidade?:string};if(data.erro||!data.localidade)throw new Error();const exact=LOCATION_REFERENCES.find((l)=>normalizeText(l.neighborhood)===normalizeText(data.bairro??"")&&normalizeText(l.city)===normalizeText(data.localidade??""));const city=LOCATION_REFERENCES.find((l)=>l.kind==="municipio"&&normalizeText(l.city)===normalizeText(data.localidade??""));const ref=exact??city;if(!ref){setError("CEP localizado, mas ainda não temos uma referência geográfica segura para essa região.");return}choose({...ref,label:data.bairro?`${data.bairro} — ${data.localidade}`:data.localidade,kind:"cep"},"cep");}catch{setError("Não foi possível consultar esse CEP. Verifique os oito números e tente novamente.");}finally{setLoading(false)}return}if(suggestions[0])choose(suggestions[0]);else setError("Não encontramos esse local. Tente um bairro ou município da Grande São Paulo.");};
  return <div id="busca" className="hero-search-card"><label>Onde você está?</label><Command shouldFilter={false} className="location-command"><CommandInput value={query} onValueChange={(v)=>{setQuery(v);setError("");setStatus("idle")}} placeholder="Digite seu bairro, cidade ou CEP" onKeyDown={(e)=>{if(e.key==="Enter"&&suggestions.length===0){e.preventDefault();void search()}}}/>{query.length>=2&&<CommandList><CommandEmpty>{normalizeCep(query)?"Pressione Enter para consultar o CEP":"Nenhuma sugestão cadastrada."}</CommandEmpty><CommandGroup heading={normalizeCep(query)?"Consultar CEP":"Sugestões de localização"}>{suggestions.map((item: LocationReference)=><CommandItem key={item.id} value={item.label} onSelect={()=>choose(item)}><MapPin/>{item.label}</CommandItem>)}</CommandGroup></CommandList>}</Command><button className="search-submit" onClick={()=>void search()} disabled={loading}>{loading?"Consultando...":"Pesquisar"}<Search size={17}/></button><div className="search-or"><span/>ou<span/></div><Button onClick={onGps} disabled={status==="requesting"} className="gps-button"><LocateFixed/>{status==="requesting"?"Buscando sua localização...":"Usar minha localização"}</Button><p className="search-privacy"><ShieldCheck/>Sua localização é utilizada somente para encontrar locais próximos e não é armazenada.</p>{error&&<p className="search-error" role="alert"><CircleAlert/>{error}</p>}{(status==="denied"||status==="unavailable")&&<p className="search-error" role="status"><CircleAlert/>{status==="denied"?"Acesso à localização negado. Digite seu bairro, cidade ou CEP.":"Localização indisponível. Digite seu bairro, cidade ou CEP."}</p>}</div>
}

function Hero({onSelect,onGps,status,setStatus}:{onSelect:(r:PositionReference)=>void;onGps:()=>void;status:LocationStatus;setStatus:(s:LocationStatus)=>void}){return <section id="inicio" className="hero expanded-hero"><div className="shell hero-grid"><div className="hero-copy"><span className="eyebrow"><HeartHandshake/>Tecnologia a serviço da solidariedade</span><h1>Encontre onde <em>doar sangue</em> perto de você</h1><p>Encontre hemocentros, bancos de sangue e hospitais que recebem doações na Grande São Paulo.</p><LocationSearch onSelect={onSelect} onGps={onGps} status={status} setStatus={setStatus}/><div className="trust-row"><span><ShieldCheck/>Sem cadastro</span><span><ShieldCheck/>Sem histórico</span><span><ShieldCheck/>Fontes oficiais</span><span><MapPin/>{PUBLIC_DONATION_CENTERS.length} locais verificados</span></div></div><div className="hero-counter"><HeroDonationCounter featured/></div></div></section>}

function Details({center,open,onOpenChange,onReport,route}:{center:CenterWithDistance|null;open:boolean;onOpenChange:(v:boolean)=>void;onReport:(center:DonationCenter)=>void;route?:RouteInfo}){if(!center)return null;const directions=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(center.fullAddress)}`;return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="details-dialog"><DialogHeader><div className="detail-badges"><Badge>{managementLabel[center.management]}</Badge><Badge variant="secondary">{typeLabel[center.type]}</Badge></div><DialogTitle>{center.name}</DialogTitle><DialogDescription>{center.donationLocationName&&center.donationLocationName!==center.name?`Local para realizar a doação: ${center.donationLocationName}`:"Informações confirmadas sobre o local de coleta."}</DialogDescription></DialogHeader><div className="details-grid"><p><MapPin/><span><strong>Endereço da coleta</strong>{center.fullAddress}</span></p><p><Clock3/><span><strong>Horário</strong>{center.donation.openingHours??"Consulte o horário oficial."}</span></p><p><Phone/><span><strong>Contato</strong>{center.contact.phone??"Informação não disponível."}{center.contact.whatsapp&&<small>WhatsApp: {center.contact.whatsapp}</small>}</span></p><p><CalendarCheck/><span><strong>Agendamento</strong>{center.donation.appointmentRequired?"Necessário":center.donation.appointmentRecommended?"Recomendado":center.donation.appointmentRequired===false?"Não é obrigatório":"Consulte a unidade"}</span></p><p><HeartHandshake/><span><strong>Serviços confirmados</strong>Doação de sangue{center.donation.plateletDonation?" e plaquetas":""}</span></p><p><Landmark/><span><strong>Gestão</strong>{managementLabel[center.management]} · {center.institutionName}</span></p></div>{center.distance!==null&&<p className="route-summary"><Navigation/>{formatDistance(center.distance)} em linha reta{route?` · ~${formatRouteDuration(route.durationMin)} de carro (${formatDistance(route.distanceKm)} de rota)`:""}</p>}<div className="detail-flags"><span>{center.donation.saturdayService?<CheckCircle2/>:<Info/>}Sábado: {center.donation.saturdayService===true?"sim":center.donation.saturdayService===false?"não":"confirme"}</span><span>{center.donation.sundayService?<CheckCircle2/>:<Info/>}Domingo: {center.donation.sundayService===true?"sim":center.donation.sundayService===false?"não":"confirme"}</span><span>{center.donation.freeParkingForDonors?<CheckCircle2/>:<Info/>}Estacionamento: {center.donation.freeParkingForDonors?"gratuito para doadores":"consulte"}</span></div><div className="details-actions"><a href={directions} target="_blank" rel="noreferrer">Como chegar<Navigation/></a>{center.donation.appointmentUrl&&<a className="secondary" href={center.donation.appointmentUrl} target="_blank" rel="noreferrer">Agendar<ExternalLink/></a>}<a className="secondary" href={center.source.officialUrl} target="_blank" rel="noreferrer">Fonte oficial<ExternalLink/></a><button type="button" className="icon-action" title="Compartilhar este local" aria-label={`Compartilhar ${center.name}`} onClick={()=>void shareCenter(center)}><Share2/></button><button type="button" className="icon-action" title="Informação desatualizada?" aria-label={`Reportar informação desatualizada sobre ${center.name}`} onClick={()=>onReport(center)}><Flag/></button></div><p className="verification-date">Fonte: {center.source.institutionName} · Última verificação das informações: {center.source.lastVerifiedAt.split("-").reverse().join("/")}.</p></DialogContent></Dialog>}

function CenterCard({center,selected,onSelect,onDetails,onReport,route,routeLoading}:{center:CenterWithDistance;selected:boolean;onSelect:()=>void;onDetails:()=>void;onReport:(center:DonationCenter)=>void;route?:RouteInfo;routeLoading?:boolean}){const open=isOpenNow(center);const directions=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(center.fullAddress)}`;return <article className={`center-card enhanced ${selected?"selected":""}`} onClick={onSelect}><div className="card-topline"><div><Badge>{managementLabel[center.management]}</Badge><Badge variant="secondary">{typeLabel[center.type]}</Badge></div>{center.distance!==null&&<strong className="distance"><Navigation/>{formatDistance(center.distance)}{route?` · ~${formatRouteDuration(route.durationMin)} de carro`:routeLoading?" · calculando rota...":""}</strong>}</div><h3>{center.name}</h3>{center.donationLocationName&&center.donationLocationName!==center.name&&<p className="donation-location"><MapPin/>Local da doação: {center.donationLocationName}</p>}<p className="address"><MapPin/>{center.neighborhood} — {center.city}</p><div className="card-summary"><span className={open===true?"open":open===false?"closed":"unknown"}>{open===true?"Aberto agora":open===false?"Fechado agora":"Consulte o horário"}</span><span>{center.donation.openingHours??"Informação não disponível."}</span></div><div className="card-actions"><button onClick={(e)=>{e.stopPropagation();onDetails()}}>Ver detalhes</button><a href={directions} target="_blank" rel="noreferrer" onClick={(e)=>e.stopPropagation()}>Como chegar<Navigation/></a>{center.donation.appointmentUrl&&<a className="light" href={center.donation.appointmentUrl} target="_blank" rel="noreferrer" onClick={(e)=>e.stopPropagation()}>Agendar</a>}<ShareButton center={center}/><ReportButton center={center} onReport={onReport}/></div><p className="hours-warning">Horários podem sofrer alterações. Confirme antes de se deslocar.</p></article>}

function DonationMap({centers,selected,onSelect,onDetails,reference}:{centers:CenterWithDistance[];selected:string;onSelect:(id:string)=>void;onDetails:(center:CenterWithDistance)=>void;reference:PositionReference|null}){return <div className="map-panel"><div className="map-header"><span><MapIcon/>Mapa de unidades</span><small>OpenStreetMap</small></div><div className="map-canvas"><DonationLeafletMap centers={centers} selected={selected} onSelect={onSelect} onDetails={onDetails} reference={reference}/></div><div className="map-legend"><span><i className="legend-user"/>Referência aproximada</span><span><i className="legend-center"/>Local de doação</span></div><p className="map-privacy"><ShieldCheck/>O mapa carrega imagens de um servidor externo (OpenStreetMap). Sua posição não é enviada a esse servidor — é usada só localmente, no seu navegador, para centralizar o mapa.</p></div>}

function Locator({reference,onChange}:{reference:PositionReference|null;onChange:()=>void}){const[type,setType]=useState("all");const[management,setManagement]=useState("all");const[distance,setDistance]=useState("all");const[availability,setAvailability]=useState("all");const[service,setService]=useState("all");const[view,setView]=useState<"list"|"map">("list");const[selected,setSelected]=useState(PUBLIC_DONATION_CENTERS[0].id);const[details,setDetails]=useState<CenterWithDistance|null>(null);const[reportCenter,setReportCenter]=useState<DonationCenter|null>(null);const[routeInfo,setRouteInfo]=useState<Record<string,RouteInfo>>({});
  const centers: CenterWithDistance[]=useMemo(()=>{const enriched=PUBLIC_DONATION_CENTERS.map(c=>({...c,distance:reference?calculateDistance(reference.latitude,reference.longitude,c.coordinates.latitude,c.coordinates.longitude):null}));return filterCenters(enriched,{type,management,maxDistance:distance==="all"?null:Number(distance),saturday:availability==="saturday",sunday:availability==="sunday",holiday:availability==="holiday",platelets:service==="platelets",onlineAppointment:service==="appointment",noAppointment:service==="walkin"});},[reference,type,management,distance,availability,service]);
  useEffect(()=>{if(!reference)return;const key=referenceKey(reference);const nearest=centers.slice(0,ROUTE_LOOKUP_LIMIT).filter((c)=>!routeInfo[`${key}:${c.id}`]);if(nearest.length===0)return;const controller=new AbortController();let cancelled=false;(async()=>{for(const c of nearest){const info=await getRouteDistance(reference,c.coordinates,controller.signal);if(cancelled)return;if(info)setRouteInfo((prev)=>({...prev,[`${key}:${c.id}`]:info}));}})();return()=>{cancelled=true;controller.abort();};
  // Recalcula só quando a referência de localização ou o conjunto de filtros muda — não a cada re-render.
  // Chavear por referência (em vez de limpar o estado) evita mostrar uma rota
  // calculada para uma localização antiga enquanto a nova ainda carrega.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[reference,type,management,distance,availability,service]);
  const expand=()=>setDistance("all");return <section id="onde-doar" className="locator-section"><div className="shell"><div className="locator-heading"><div><span className="eyebrow"><MapPin/>Locais cadastrados na Grande São Paulo</span><h2>{reference?.neighborhood?`Locais próximos de ${reference.neighborhood}`:reference?`Locais próximos de ${reference.label}`:"Locais verificados para doar"}</h2><p>{reference?`Encontramos ${centers.length} locais para doação ordenados por distância aproximada.`:`Explore ${centers.length} unidades com informações confirmadas em fontes oficiais.`}</p></div>{reference&&<button className="change-location" onClick={onChange}>Alterar localização</button>}</div><div className="results-toolbar expanded"><div className="filters"><Select value={management} onValueChange={(v)=>v&&setManagement(v)}><SelectTrigger><SelectValue placeholder="Gestão"/></SelectTrigger><SelectContent><SelectItem value="all">Todas as gestões</SelectItem><SelectItem value="publico">Pública</SelectItem><SelectItem value="privado">Privada</SelectItem><SelectItem value="filantropico">Filantrópica</SelectItem></SelectContent></Select><Select value={type} onValueChange={(v)=>v&&setType(v)}><SelectTrigger><SelectValue placeholder="Tipo"/></SelectTrigger><SelectContent><SelectItem value="all">Todos os tipos</SelectItem><SelectItem value="hemocentro">Hemocentro</SelectItem><SelectItem value="banco_sangue">Banco de sangue</SelectItem><SelectItem value="hospital_com_coleta">Hospital com coleta</SelectItem><SelectItem value="posto_coleta">Posto de coleta</SelectItem></SelectContent></Select><Select value={distance} onValueChange={(v)=>v&&setDistance(v)}><SelectTrigger><SelectValue placeholder="Distância"/></SelectTrigger><SelectContent><SelectItem value="all">Qualquer distância</SelectItem><SelectItem value="5">Até 5 km</SelectItem><SelectItem value="10">Até 10 km</SelectItem><SelectItem value="20">Até 20 km</SelectItem></SelectContent></Select><Select value={availability} onValueChange={(v)=>v&&setAvailability(v)}><SelectTrigger><SelectValue placeholder="Disponibilidade"/></SelectTrigger><SelectContent><SelectItem value="all">Todos os dias</SelectItem><SelectItem value="saturday">Atende sábado</SelectItem><SelectItem value="sunday">Atende domingo</SelectItem><SelectItem value="holiday">Atende feriado</SelectItem></SelectContent></Select><Select value={service} onValueChange={(v)=>v&&setService(v)}><SelectTrigger><SelectValue placeholder="Serviço"/></SelectTrigger><SelectContent><SelectItem value="all">Todos os serviços</SelectItem><SelectItem value="platelets">Doação de plaquetas</SelectItem><SelectItem value="appointment">Agendamento online</SelectItem><SelectItem value="walkin">Sem agendamento obrigatório</SelectItem></SelectContent></Select></div><div className="view-toggle"><button className={view==="list"?"active":""} onClick={()=>setView("list")}><Menu/>Lista</button><button className={view==="map"?"active":""} onClick={()=>setView("map")}><MapIcon/>Mapa</button></div></div>{centers.length===0?<div className="empty-state"><MapPin/><h3>Não encontramos locais cadastrados dentro deste raio.</h3><p>Amplie a distância ou remova algum filtro.</p><Button onClick={expand}>Ampliar distância</Button></div>:<div className={`locator-grid ${view==="map"?"show-map":"show-list"}`}><div className="center-list">{centers.map((c,i)=>{const key=reference?`${referenceKey(reference)}:${c.id}`:null;return <CenterCard key={c.id} center={c} selected={selected===c.id} onSelect={()=>setSelected(c.id)} onDetails={()=>setDetails(c)} onReport={setReportCenter} route={key?routeInfo[key]:undefined} routeLoading={Boolean(key)&&i<ROUTE_LOOKUP_LIMIT&&!routeInfo[key!]}/>})}</div><DonationMap centers={centers} selected={selected} onSelect={setSelected} onDetails={setDetails} reference={reference}/></div>}<p className="data-note"><Info/>Distância em linha reta por padrão; para os locais mais próximos, também estimamos o tempo de carro via OpenStreetMap (OSRM) quando o serviço está disponível. Base revisada em 28/08/2026.</p><Details center={details} open={Boolean(details)} onOpenChange={(v)=>!v&&setDetails(null)} onReport={setReportCenter} route={details&&reference?routeInfo[`${referenceKey(reference)}:${details.id}`]:undefined}/><ReportDialog center={reportCenter} open={Boolean(reportCenter)} onOpenChange={(v)=>!v&&setReportCenter(null)}/></div></section>}

function HealthSections(){const requirements=["Boas condições de saúde","Entre 16 e 69 anos, observadas as regras específicas","Peso mínimo de 50 kg","Estar alimentado; não é necessário jejum","Ter dormido pelo menos 6 horas nas últimas 24 horas","Documento oficial de identificação com foto"];const temporary=["Gripe, resfriado, febre ou infecção","Gravidez, período após o parto e amamentação","Consumo recente de bebida alcoólica","Tatuagem, piercing ou procedimentos médicos recentes","Vacinação, endoscopia ou procedimentos odontológicos","Viagens para regiões com riscos epidemiológicos específicos"];const definitive=["Determinadas doenças infecciosas transmissíveis pelo sangue","Algumas condições clínicas e históricos específicos de doença","Situações relacionadas ao uso de drogas injetáveis"];return <><section id="posso-doar" className="eligibility-section"><div className="shell"><div className="section-intro"><span className="eyebrow"><Stethoscope/>Orientação responsável</span><h2>Posso doar sangue?</h2><p>Os critérios abaixo são orientações gerais. A aptidão definitiva é determinada pela triagem realizada pelo serviço de hemoterapia.</p></div><div className="quiz-cta"><div><strong>Quer uma resposta para o seu caso?</strong><span>Faça o teste: só clicando, em cerca de 2 minutos.</span></div><a className="quiz-primary" href="/posso-doar">Fazer o teste<ArrowRight/></a></div><div className="eligibility-grid"><article className="requirements-card"><div className="health-card-title"><CheckCircle2/><div><small>Quem pode doar?</small><h3>Requisitos básicos</h3></div></div><ul>{requirements.map(item=><li key={item}><Check/>{item}</li>)}</ul><p>Menores de 18 anos precisam de consentimento formal do responsável legal. Entre 60 e 69 anos, a doação é admitida para quem já havia doado antes dos 60.</p></article><article className="temporary-card"><div className="health-card-title"><Clock3/><div><small>Impedimentos temporários</small><h3>Algumas situações exigem espera</h3></div></div><ul>{temporary.map(item=><li key={item}><span/> {item}</li>)}</ul><p>Os prazos variam conforme a situação, a norma vigente e a avaliação clínica. Consulte a unidade antes de comparecer.</p></article></div><article className="definitive-card"><CircleAlert/><div><h3>Existem também impedimentos definitivos</h3><p>{definitive.join("; ")}. A avaliação é individual e deve ser feita de forma médica, objetiva e não estigmatizante.</p></div></article><div className="health-sources"><span>Fonte principal: Ministério da Saúde · Informações revisadas em 28/08/2026.</span><a href="https://www.gov.br/saude/pt-br/composicao/saes/doacao-de-sangue" target="_blank" rel="noreferrer">Consultar critérios completos<ExternalLink/></a><a href="https://www.portal.prosangue.sp.gov.br/fps/doa%C3%A7%C3%A3o%20de%20sangue/quem_nao_pode_doar" target="_blank" rel="noreferrer">Impedimentos — fonte oficial<ExternalLink/></a></div></div></section><section id="antes-de-ir" className="before-go-section"><div className="shell before-go-card"><div><span className="eyebrow light"><Sparkles/>Checklist rápido</span><h2>Antes de sair para doar</h2></div><ul><li><Check/>Confira o horário da unidade</li><li><Check/>Verifique se é necessário agendamento</li><li><Check/>Leve documento oficial com foto</li><li><Check/>Confira os requisitos para doação — <a href="/posso-doar">faça o teste</a></li><li><Check/>Em caso de dúvida, consulte a unidade</li></ul></div></section></>}

function OtherSections(){const steps=[["01","Informe onde está","Use sua localização, bairro, cidade ou CEP."],["02","Compare os locais","Veja distância, gestão, horário e serviços."],["03","Confira e siga a rota","Confirme os dados e abra a navegação real."]];return <><section id="como-funciona" className="how-section"><div className="shell"><div className="section-intro"><span className="eyebrow">Simples por princípio</span><h2>Encontrar onde doar deveria ser simples</h2><p>Três passos, nenhuma conta e nenhuma pesquisa armazenada.</p></div><div className="steps-grid">{steps.map(([n,t,p])=><article key={n}><span>{n}</span><div className="step-icon">{n==="01"?<LocateFixed/>:n==="02"?<MapPin/>:<Navigation/>}</div><h3>{t}</h3><p>{p}</p></article>)}</div></div></section><section className="privacy-section"><div className="shell privacy-card"><div className="privacy-symbol"><ShieldCheck/></div><div><span className="eyebrow light">Privacidade por design</span><h2>Sua localização é sua.</h2><p>A posição, o CEP e o bairro pesquisado são usados somente durante a consulta. Não criamos contas, perfis ou históricos.</p><a href="/privacidade">Leia nosso compromisso de privacidade<ArrowRight/></a></div><div className="privacy-rules"><span><Check/>Sem cookies de rastreamento</span><span><Check/>Sem histórico de buscas</span><span><Check/>Sem venda de dados</span><span><Check/>Cálculo local de distância</span></div></div></section><section id="sobre" className="about-section"><div className="shell about-grid"><div><span className="eyebrow"><Scale/>Saúde, cidadania e acesso</span><h2>Proximidade. Confiabilidade. Solidariedade.</h2></div><div><p>O <strong>Gotas que Salvam</strong> aproxima pessoas de locais verificados para doação, sem criar falsa sensação de completude.</p><p>O projeto possui caráter informativo e não substitui a avaliação realizada pelos profissionais responsáveis pela triagem. Horários e condições podem mudar; confirme diretamente com a instituição.</p></div></div></section></>}

function Footer(){return <footer><div className="shell footer-grid"><div><Logo/><p>Uma escolha. Uma doação. Muitas vidas.</p></div><div><strong>Navegue</strong><a href="#onde-doar">Onde doar</a><a href="#posso-doar">Posso doar?</a><a href="/privacidade">Privacidade</a></div><div><strong>Fontes oficiais</strong><a href="https://www.gov.br/saude/pt-br/composicao/saes/doacao-de-sangue" target="_blank">Ministério da Saúde</a><a href="https://www.portal.prosangue.sp.gov.br/fps" target="_blank">Fundação Pró-Sangue</a><a href="https://colsan.org.br/doador/locais-para-doacao-de-sangue/" target="_blank">COLSAN</a><p>Base revisada: 28/08/2026</p></div></div><div className="shell footer-bottom"><span>© 2026 Gotas que Salvam</span><span>Plataforma informativa, sem armazenamento de localização.</span></div></footer>}

export default function Home(){const[reference,setReference]=useState<PositionReference|null>(null);const[status,setStatus]=useState<LocationStatus>("idle");const choose=(r:PositionReference)=>{setReference(r);setStatus("ready");setTimeout(()=>document.querySelector("#onde-doar")?.scrollIntoView({behavior:"smooth"}),80)};const gps=()=>{if(!navigator.geolocation){setStatus("unavailable");return}setStatus("requesting");navigator.geolocation.getCurrentPosition(({coords})=>choose({latitude:coords.latitude,longitude:coords.longitude,label:"sua localização",source:"gps"}),(error)=>setStatus(error.code===error.PERMISSION_DENIED?"denied":"unavailable"),{enableHighAccuracy:false,timeout:10000,maximumAge:120000})};const change=()=>{setReference(null);setStatus("idle");document.querySelector("#busca")?.scrollIntoView({behavior:"smooth",block:"center"})};return <main><Header/><Hero onSelect={choose} onGps={gps} status={status} setStatus={setStatus}/><Locator reference={reference} onChange={change}/><OtherSections/><HealthSections/><Footer/></main>}
