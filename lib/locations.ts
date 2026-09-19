export interface LocationReference { id: string; neighborhood: string; city: string; label: string; latitude: number; longitude: number; kind: "bairro" | "municipio" | "cep" }
const loc = (neighborhood: string, city: string, latitude: number, longitude: number, kind: "bairro" | "municipio" = "bairro"): LocationReference => ({ id:`${neighborhood}-${city}`.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-"), neighborhood, city, label:kind === "municipio" ? city : `${neighborhood} — ${city}`, latitude, longitude, kind });
export const LOCATION_REFERENCES: LocationReference[] = [
  loc("Moema","São Paulo",-23.597085,-46.6628884), loc("Morumbi","São Paulo",-23.5974288,-46.7067746),
  loc("Saúde","São Paulo",-23.615178,-46.6433933), loc("Tatuapé","São Paulo",-23.5402524,-46.5766424),
  loc("Itaquera","São Paulo",-23.5422994,-46.4712065), loc("Vila Mariana","São Paulo",-23.5837,-46.6327408),
  loc("Vila Clementino","São Paulo",-23.5980058,-46.6434179), loc("Higienópolis","São Paulo",-23.5442937,-46.6544499),
  loc("Bela Vista","São Paulo",-23.5601219,-46.6500338), loc("Paraíso","São Paulo",-23.575378,-46.6420129),
  loc("Santo Amaro","São Paulo",-23.6556547,-46.7209734), loc("Pinheiros","São Paulo",-23.567249,-46.7019515),
  loc("Santana","São Paulo",-23.499321,-46.6289326), loc("Aclimação","São Paulo",-23.5671021,-46.6268011),
  loc("Ermelino Matarazzo","São Paulo",-23.4902552,-46.4824048), loc("Jabaquara","São Paulo",-23.6487101,-46.645451),
  loc("Centro","Santo André",-23.6579186,-46.5264427), loc("Centro","São Bernardo do Campo",-23.7096982,-46.5504348),
  loc("Centro","São Caetano do Sul",-23.6116088,-46.5747725), loc("Alphaville","Barueri",-23.4989809,-46.8478321),
  loc("Presidente Altino","Osasco",-23.5312344,-46.7617426), loc("Vila Galvão","Guarulhos",-23.4523388,-46.5620076),
  loc("Centro","Guarulhos",-23.4685543,-46.5302985), loc("Centro","Barueri",-23.5114599,-46.8745754),
  loc("São Paulo","São Paulo",-23.5506507,-46.6333824,"municipio"), loc("Guarulhos","Guarulhos",-23.4685543,-46.5302985,"municipio"),
  loc("Osasco","Osasco",-23.532,-46.791,"municipio"), loc("Barueri","Barueri",-23.5114599,-46.8745754,"municipio"),
  loc("Santo André","Santo André",-23.6579186,-46.5264427,"municipio"), loc("São Bernardo do Campo","São Bernardo do Campo",-23.7096982,-46.5504348,"municipio"),
  loc("São Caetano do Sul","São Caetano do Sul",-23.6116088,-46.5747725,"municipio"),
  loc("Mauá","Mauá",-23.6686648,-46.4579699,"municipio"), loc("Diadema","Diadema",-23.70657,-46.6089,"municipio"),
  loc("Taboão da Serra","Taboão da Serra",-23.6411,-46.8095,"municipio"),
];
