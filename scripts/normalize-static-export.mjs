import { readdir, copyFile, mkdir } from "node:fs/promises";
import { resolve, relative, sep, dirname, join } from "node:path";

// Next 16 gera caminhos de segmentos com separadores nativos no Windows.
// O navegador pede os mesmos nomes com pontos, como no export gerado no Linux.
// Criamos apenas as cópias esperadas, sem remover ou alterar os originais.
async function normalizeExport(root) {
  let count = 0;
  async function collect(directory, prefix, parent) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const source = join(directory, entry.name);
      if (entry.isDirectory()) await collect(source, prefix, parent);
      else if (entry.name.endsWith(".txt")) {
        const filename = `${prefix}.${relative(parent, source).split(sep).join(".")}`;
        const destination = join(dirname(parent), filename);
        await mkdir(dirname(destination), { recursive: true });
        await copyFile(source, destination);
        count++;
      }
    }
  }
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name === "_next") continue;
      const child = join(directory, entry.name);
      if (entry.name.startsWith("__next."))
        await collect(child, entry.name, child);
      else await visit(child);
    }
  }
  await visit(root);
  return count;
}

if (process.env.GITHUB_PAGES === "true") {
  const workspace = resolve(process.cwd());
  const root = resolve(process.argv[2] ?? "out");
  if (!root.startsWith(workspace + sep)) {
    throw new Error("A exportação deve estar dentro da pasta do projeto.");
  }
  console.log(
    `Prefetch estático: ${await normalizeExport(root)} arquivos normalizados.`,
  );
}
