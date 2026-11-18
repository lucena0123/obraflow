"use client";
import Link from "next/link";
import { projectHref } from "@/lib/routes";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  HardHat,
  CalendarRange,
  NotebookPen,
  Wallet,
  CircleAlert,
  ChartNoAxesCombined,
  Settings2,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Bell,
  Search,
  Menu,
  X,
  ShieldCheck,
  CircleHelp,
  Check,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { DEMO, IS_ELECTRICAL } from "@/domain/demo";
import { useData } from "@/data/store";
import { visibleProjects } from "@/domain/calculations";
import { Avatar, Modal, Select } from "./common";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { RlmLogo } from "./rlm-logo";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

const links = [
  { href: "/", label: "Visão geral", icon: LayoutDashboard },
  { href: "/obras", label: "Obras e projetos", icon: HardHat },
  { href: "/cronograma", label: "Cronograma", icon: CalendarRange },
  { href: "/diario", label: "Diário de obras", icon: NotebookPen },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/pendencias", label: "Pendências", icon: CircleAlert },
  { href: "/relatorios", label: "Relatórios", icon: ChartNoAxesCombined },
];
export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const mobileTrigger = useRef<HTMLButtonElement>(null);
  const { data, store, notice, blocked } = useData();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [help, setHelp] = useState(false);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 761px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMobileOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  const current = links.find((l) =>
    l.href === "/" ? pathname === "/" : pathname.startsWith(l.href),
  );
  const critical =
    data?.issues.filter(
      (i) =>
        i.status !== "resolved" &&
        i.priority === "critical" &&
        visibleProjects(data).some((p) => p.id === i.projectId),
    ).length ?? 0;
  useEffect(() => {
    if (!notice || notice.error) return;
    const timeout = setTimeout(store.dismiss, 5000);
    return () => clearTimeout(timeout);
  }, [notice, store]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (
        event.key === "/" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !(
          event.target instanceof HTMLElement &&
          (event.target.matches("input, textarea, select") ||
            event.target.isContentEditable)
        )
      ) {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);
  const navigation = (
    <>
      <Link href="/" className="brand" onClick={() => setMobileOpen(false)}>
        <RlmLogo variant="white" />
        <span className="brand-product">
          {DEMO.name}
          <small>{DEMO.tagline}</small>
        </span>
      </Link>
      <div className="workspace-label">SEU ESPAÇO DE TRABALHO</div>
      <div className="workspace-switch">
        <span className="workspace-icon">
          {IS_ELECTRICAL ? <Zap size={19} /> : <HardHat size={19} />}
        </span>
        <span>
          {DEMO.unit}
          <small>{DEMO.operation}</small>
        </span>
        <ShieldCheck size={15} />
      </div>
      <div className="nav-label">PRINCIPAL</div>
      <nav aria-label="Navegação principal">
        {links
          .filter(
            (l) => l.href !== "/relatorios" || data?.profile !== "supervisor",
          )
          .map((l) => {
            const active = current?.href === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`nav-link ${active ? "active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                <l.icon size={19} />
                <span>{l.label}</span>
                {l.href === "/pendencias" && critical > 0 && (
                  <span className="nav-count">{critical}</span>
                )}
                {active && <span className="nav-active-dot" />}
              </Link>
            );
          })}
      </nav>
      <div className="sidebar-bottom">
        <div className="demo-card">
          <span className="demo-card-label">
            <span className="tiny-dot" />
            AMBIENTE DEMONSTRATIVO
          </span>
          <h3>
            {IS_ELECTRICAL
              ? "Planeje. Registre. Acompanhe."
              : "Explore. Planeje. Construa."}
          </h3>
          <p>Uma nova perspectiva para a sua operação.</p>
          <button onClick={() => setHelp(true)}>
            Conheça a demonstração <ArrowUpRight size={16} />
          </button>
        </div>
        <Link
          href="/configuracoes"
          className={`nav-link ${pathname === "/configuracoes" ? "active" : ""}`}
          onClick={() => setMobileOpen(false)}
        >
          <Settings2 size={18} />
          Configurações
        </Link>
        <button className="nav-link" onClick={() => setHelp(true)}>
          <CircleHelp size={18} />
          Guia da demonstração
        </button>
        <div className="sidebar-footer">
          <span className="tiny-dot" />
          Dados salvos no navegador <span>v1.0</span>
        </div>
      </div>
    </>
  );
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Ir para o conteúdo
      </a>

      <aside className="sidebar">{navigation}</aside>
      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent
          id="mobile-navigation"
          className="mobile-sidebar-dialog translate-x-0 translate-y-0"
          showCloseButton={false}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            mobileTrigger.current?.focus();
          }}
        >
          <DialogTitle className="sr-only">Navegação principal</DialogTitle>
          <DialogDescription className="sr-only">
            Escolha um módulo ou feche o menu para voltar ao conteúdo.
          </DialogDescription>
          <aside className="sidebar is-open">
            <Button
              className="mobile-nav-close"
              variant="ghost"
              size="icon"
              aria-label="Fechar navegação"
              onClick={() => setMobileOpen(false)}
            >
              <X size={18} />
            </Button>
            {navigation}
          </aside>
        </DialogContent>
      </Dialog>
      <div className="app-body">
        <header className="topbar">
          <div className="breadcrumb">
            <Button
              variant="ghost"
              size="icon"
              className="mobile-menu"
              ref={mobileTrigger}
              aria-haspopup="dialog"
              aria-expanded={mobileOpen}
              aria-controls={mobileOpen ? "mobile-navigation" : undefined}
              aria-label="Abrir navegação"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </Button>
            <span className="desktop-crumb">
              Workspace <ChevronRight size={13} />
            </span>
            <span>
              {current?.label ??
                (pathname === "/configuracoes" ? "Configurações" : "Obra")}
            </span>
          </div>
          <div className="topbar-actions">
            <button
              className="global-search"
              onClick={() => setSearchOpen(true)}
              aria-label="Buscar uma obra"
            >
              <Search size={17} />
              <span>Buscar uma obra</span>
              <kbd aria-hidden="true">/</kbd>
            </button>
            <Link
              className="notification-button"
              href="/pendencias"
              aria-label="Ver pendências"
            >
              <Bell size={19} />
              {critical > 0 && <i />}
            </Link>
            <div className="topbar-divider" />
            <Avatar id={data?.profile === "supervisor" ? "lia" : "caio"} />
            <div className="profile-switch">
              <small>PERFIL DEMONSTRATIVO</small>
              <Select
                label="Alternar perfil demonstrativo"
                value={data?.profile ?? "coordinator"}
                onChange={(e) =>
                  store.setProfile(
                    e.target.value as "coordinator" | "supervisor",
                  )
                }
                disabled={!data || blocked}
              >
                <option value="coordinator">Coordenador</option>
                <option value="supervisor">Supervisor</option>
              </Select>
            </div>
            <ChevronDown size={13} className="profile-chevron" />
          </div>
        </header>
        <main id="main-content">
          {IS_ELECTRICAL && (
            <section
              className="electrical-demo-note"
              aria-label="Sobre a demonstração elétrica"
            >
              <Zap size={21} aria-hidden="true" />
              <div>
                <strong>Demonstração para o setor elétrico</strong>
                <p>
                  Dados fictícios salvos neste navegador. Apoio gerencial, sem
                  validade como projeto, laudo ou liberação de serviço.
                </p>
              </div>
              <button onClick={() => setHelp(true)}>
                Como funciona <ArrowUpRight size={15} aria-hidden="true" />
              </button>
            </section>
          )}
          {blocked && (
            <div className="storage-banner" role="alert">
              <TriangleAlert size={18} />
              <span>
                A base local está indisponível. Os dados abaixo são apenas uma
                prévia.
              </span>
              <Link href="/configuracoes">Restaurar dados</Link>
            </div>
          )}
          {data?.profile === "supervisor" && (
            <div className="scope-banner">
              <ShieldCheck size={15} />
              Visão do supervisor · Lia Monte Azul · somente suas obras. Perfil
              demonstrativo, sem autenticação.
            </div>
          )}
          {children}
        </main>
        <footer className="app-footer">
          <RlmLogo variant="white" />
          <div>
            <strong>{DEMO.name} · RLM Soluções Industriais</strong>
            <p>RLM Serviços e Soluções para Equipamentos Industriais LTDA</p>
            <p>
              © {new Date().getFullYear()} · Demonstração com dados fictícios ·
              Dados salvos neste navegador
            </p>
            {IS_ELECTRICAL && (
              <p>
                <a
                  href={`${(process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/eletrica$/, "")}/`}
                >
                  Ver demonstração industrial
                </a>
              </p>
            )}
          </div>
        </footer>
      </div>
      {notice && (
        <div
          role={notice.error ? "alert" : "status"}
          className={`toast ${notice.error ? "toast-error" : ""}`}
        >
          {notice.error ? <TriangleAlert size={20} /> : <Check size={20} />}
          <span>{notice.message}</span>
          <button aria-label="Fechar mensagem" onClick={store.dismiss}>
            <X size={16} />
          </button>
        </div>
      )}
      {searchOpen && (
        <Modal
          title="Encontre sua obra"
          description="Busque por nome, código ou área nas obras disponíveis no seu perfil."
          onClose={() => setSearchOpen(false)}
        >
          <div className="search-input">
            <Search size={17} />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nome, código ou área…"
              aria-label="Busca global de obras"
            />
          </div>
          <div className="search-results">
            {data &&
              visibleProjects(data)
                .filter((p) =>
                  `${p.name} ${p.code} ${p.area}`
                    .toLocaleLowerCase("pt-BR")
                    .includes(query.toLocaleLowerCase("pt-BR")),
                )
                .map((p) => (
                  <Link
                    key={p.id}
                    href={projectHref(p.id)}
                    onClick={() => setSearchOpen(false)}
                  >
                    <HardHat size={18} />
                    <span>
                      {p.name}
                      <small>
                        {p.code} · {p.area}
                      </small>
                    </span>
                    <ChevronRight size={15} />
                  </Link>
                ))}
          </div>
        </Modal>
      )}
      {help && (
        <Modal
          title={`Bem-vindo ao ${DEMO.name}`}
          description={
            IS_ELECTRICAL
              ? "Acompanhamento de obras elétricas, do planejamento à entrega documental."
              : "Gestão de obras e melhorias industriais, do planejamento à entrega."
          }
          onClose={() => setHelp(false)}
        >
          <div className="help-content">
            <p>
              Todos os nomes, obras e valores são fictícios. As alterações ficam
              salvas apenas neste navegador.
            </p>
            <ol>
              <li>
                <strong>Explore o portfólio.</strong> Use os filtros da visão
                geral e abra uma obra para ver etapas e histórico.
              </li>
              <li>
                <strong>Atualize o campo.</strong> Registre um diário e veja o
                avanço mudar em todos os módulos.
              </li>
              <li>
                <strong>Acompanhe resultados.</strong> Consulte custos, trate
                pendências e imprima o relatório consolidado.
              </li>
              <li>
                <strong>Experimente os perfis.</strong> O Coordenador gerencia o
                portfólio; o Supervisor acompanha suas próprias obras.
              </li>
            </ol>
            <p>
              Você pode restaurar a base fictícia em Configurações. Estes perfis
              não representam autenticação de produção.
            </p>
            {IS_ELECTRICAL && (
              <p>
                Os exemplos de painéis, infraestrutura, cabeamento e inspeção
                são fictícios. O aplicativo não calcula ou dimensiona
                instalações, não certifica conformidade e não substitui os
                procedimentos de segurança ou a autorização dos responsáveis
                técnicos.
              </p>
            )}
          </div>
          <Button onClick={() => setHelp(false)}>
            Vamos começar <ArrowUpRight size={16} />
          </Button>
        </Modal>
      )}
    </div>
  );
}
