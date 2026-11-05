"use client";
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="empty-state" role="alert">
      <h2>Não foi possível abrir esta tela</h2>
      <p>
        Recarregue a página para tentar novamente. Seus dados locais permanecem
        no navegador.
      </p>
      <button className="text-link" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}
