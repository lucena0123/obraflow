"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { DemoState, Profile } from "@/domain/types";
import { createSeed } from "./seed";
import {
  isDemoState,
  LocalRepository,
  STORAGE_KEY,
  type Repository,
} from "./repository";

interface Snapshot {
  data: DemoState | null;
  notice: { message: string; error: boolean; id: number } | null;
  blocked: boolean;
}
const EMPTY_SNAPSHOT: Snapshot = { data: null, notice: null, blocked: false };
const CONFLICT =
  "Os dados foram atualizados em outra aba. Nenhuma alteração deste formulário foi salva. Feche e reabra o formulário para conferir os dados atuais.";

export class ObraStore {
  private snapshot: Snapshot = EMPTY_SNAPSHOT;
  private listeners = new Set<() => void>();
  private hydration: Promise<void> | null = null;
  constructor(private repository: Repository) {}
  subscribe = (callback: () => void) => {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  };
  getSnapshot = () => this.snapshot;
  getServerSnapshot = (): Snapshot => EMPTY_SNAPSHOT;
  private emit(snapshot: Snapshot) {
    this.snapshot = snapshot;
    this.listeners.forEach((l) => l());
  }
  private exclusive<T>(operation: () => T): Promise<T> {
    return this.repository.withWriteLock
      ? this.repository.withWriteLock(operation)
      : Promise.resolve().then(operation);
  }
  async hydrate() {
    if (this.snapshot.data) return;
    if (this.hydration) return this.hydration;
    this.hydration = this.exclusive(() => {
      const stored = this.repository.load();
      const data = stored ?? createSeed();
      if (!stored) this.repository.save(data);
      this.emit({ data, notice: null, blocked: false });
    }).catch((e) => {
      this.emit({
        data: createSeed(),
        notice: {
          message:
            e instanceof Error ? e.message : "Falha ao ler os dados locais.",
          error: true,
          id: Date.now(),
        },
        blocked: true,
      });
    });
    return this.hydration;
  }
  sync = () => {
    if (!this.snapshot.data) return;
    try {
      const data = this.repository.load();
      if (!data)
        throw new Error(
          "A base local foi removida em outra aba. Restaure a demonstração para continuar.",
        );
      if (JSON.stringify(data) !== JSON.stringify(this.snapshot.data))
        this.emit({
          data,
          notice: {
            message:
              "Dados atualizados em outra aba. Formulários já abertos precisam ser reabertos antes de salvar.",
            error: false,
            id: Date.now(),
          },
          blocked: false,
        });
    } catch (e) {
      this.emit({
        ...this.snapshot,
        blocked: true,
        notice: {
          message:
            e instanceof Error
              ? e.message
              : "Falha ao atualizar os dados locais.",
          error: true,
          id: Date.now(),
        },
      });
    }
  };
  async commit(
    command: (data: DemoState) => void,
    message = "Alterações salvas neste navegador.",
    expectedRevision = this.snapshot.data?.revision,
  ): Promise<boolean> {
    try {
      if (!this.snapshot.data)
        throw new Error("Aguarde o carregamento dos dados.");
      if (this.snapshot.blocked)
        throw new Error(
          "Restaure a demonstração antes de salvar; os dados locais atuais estão indisponíveis.",
        );
      // Leitura, revisão e escrita compartilham o mesmo lock entre abas.
      return await this.exclusive(() => {
        const latest = this.repository.load();
        if (!latest)
          throw new Error(
            "A base local foi removida. Restaure a demonstração antes de salvar.",
          );
        if (latest.revision !== expectedRevision) {
          this.emit({
            data: latest,
            blocked: false,
            notice: { message: CONFLICT, error: true, id: Date.now() },
          });
          return false;
        }
        const data = structuredClone(latest);
        command(data);
        data.revision = crypto.randomUUID();
        if (!isDemoState(data))
          throw new Error(
            "A alteração produziria dados inconsistentes e não foi salva.",
          );
        this.repository.save(data);
        this.emit({
          data,
          notice: { message, error: false, id: Date.now() },
          blocked: false,
        });
        return true;
      });
    } catch (e) {
      this.notify(
        e instanceof Error ? e.message : "Não foi possível salvar.",
        true,
      );
      return false;
    }
  }
  notify(message: string, error = false) {
    this.emit({ ...this.snapshot, notice: { message, error, id: Date.now() } });
  }
  dismiss = () => this.emit({ ...this.snapshot, notice: null });
  setProfile(profile: Profile) {
    return this.commit(
      (data) => {
        data.profile = profile;
      },
      profile === "coordinator"
        ? "Perfil demonstrativo: Coordenador."
        : "Perfil demonstrativo: Supervisor · Lia Monte Azul.",
    );
  }
  async reset(
    expectedRevision = this.snapshot.data?.revision,
  ): Promise<boolean> {
    try {
      return await this.exclusive(() => {
        let latest: DemoState | null = null;
        try {
          latest = this.repository.load();
        } catch {
          /* Restauração explícita de uma base inválida. */
        }
        if (latest && latest.revision !== expectedRevision) {
          this.emit({
            data: latest,
            blocked: false,
            notice: { message: CONFLICT, error: true, id: Date.now() },
          });
          return false;
        }
        const data = createSeed();
        data.revision = crypto.randomUUID();
        this.repository.save(data);
        this.emit({
          data,
          notice: {
            message: "Dados demonstrativos restaurados.",
            error: false,
            id: Date.now(),
          },
          blocked: false,
        });
        return true;
      });
    } catch (e) {
      this.notify(e instanceof Error ? e.message : "Falha ao restaurar.", true);
      return false;
    }
  }
}
const Context = createContext<ObraStore | null>(null);
export function DataProvider({ children }: { children: ReactNode }) {
  const [store] = useState(() => new ObraStore(new LocalRepository()));
  useEffect(() => {
    void store.hydrate();
  }, [store]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) store.sync();
    };
    const refresh = () => {
      if (document.visibilityState === "visible") {
        store.sync();
        window.dispatchEvent(new Event("obraflow:clock"));
      }
    };
    window.addEventListener("storage", sync);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("storage", sync);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [store]);
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useData() {
  const store = useContext(Context);
  if (!store) throw new Error("DataProvider ausente.");
  return {
    ...useSyncExternalStore(
      store.subscribe,
      store.getSnapshot,
      store.getServerSnapshot,
    ),
    store,
  };
}
