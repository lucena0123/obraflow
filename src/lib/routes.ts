// A rota estática também permite abrir obras criadas apenas no navegador.
export function projectHref(id: string) {
  return `/obras/detalhe/?id=${encodeURIComponent(id)}`;
}
