const PROTOCOL = [
  { title: "E-mail", detail: "3x/dia: 9h, 13h, 17h" },
  { title: "Chat/Slack", detail: "Em lotes, sem notificação push" },
  { title: "Reuniões", detail: "Máx. 30min, pauta obrigatória" },
  { title: "Foco profundo", detail: "Notificações desligadas" },
];

export default function CommunicationProtocol() {
  return (
    <section className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-4 flex flex-col gap-4">
      <h2 className="text-lg font-semibold">Protocolo de Comunicação</h2>
      <ul className="flex flex-col gap-3">
        {PROTOCOL.map((item) => (
          <li key={item.title} className="flex items-baseline justify-between gap-4 text-sm">
            <span className="font-medium">{item.title}</span>
            <span className="text-neutral-500 text-right">{item.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
