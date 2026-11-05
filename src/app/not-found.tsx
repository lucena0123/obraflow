import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-state">
      <h1>Página não encontrada</h1>
      <p>Continue pelo painel ou consulte o portfólio de obras.</p>
      <Link className="text-link" href="/">
        Voltar à visão geral
      </Link>
    </div>
  );
}
