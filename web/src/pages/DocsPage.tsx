import { Breadcrumbs, Card, DiagramIcon, DocsIcon, HealthIcon, SettingsIcon, SparkIcon } from '../components';

export function DocsPage() {
  const sections = [
    {
      title: '1. Organize the review',
      icon: DocsIcon,
      body: 'Create an organization for the demo account, add a workspace for the architecture area, and keep diagrams grouped under that workspace.',
    },
    {
      title: '2. Upload architecture context',
      icon: DiagramIcon,
      body: 'Create a diagram with a text description or upload an image file. The detail page shows the uploaded architecture asset and the structured description.',
    },
    {
      title: '3. Run AI analysis',
      icon: SparkIcon,
      body: 'CoArchitect AI sends the architecture context to the configured agent, then the application scoring engine calculates the final Architecture Intelligence Score.',
    },
    {
      title: '4. Validate infrastructure',
      icon: HealthIcon,
      body: 'Use the health page to test TiDB, Azure Blob Storage, and Azure AI Foundry connectivity from the local Docker backend.',
    },
    {
      title: '5. Bring your own Foundry settings',
      icon: SettingsIcon,
      body: 'Use Settings to save a project endpoint, agent id, model deployment, API version, and API key in the application database for local runs.',
    },
  ];

  return (
    <div className="page-shell">
      <section className="space-y-3 py-2">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Docs' }]} />
        <h1 className="text-3xl font-bold tracking-normal text-secondary-950 dark:text-white">CoArchitect AI Docs</h1>
        <p className="max-w-3xl text-sm leading-6 text-secondary-600 dark:text-secondary-300">
          A compact guide for using the tool during the hackathon demo. The current product is intentionally unauthenticated so the architecture review flow stays fast.
        </p>
      </section>

      <Card>
        <article>
          <h2 className="text-xl font-bold text-secondary-950 dark:text-white">What this tool does</h2>
          <p className="mt-3 text-sm leading-6 text-secondary-600 dark:text-secondary-300">
            CoArchitect AI reviews software architecture evidence, identifies missing controls, explains trade-offs, recommends improvements, and displays an Architecture Intelligence Score.
          </p>
          <p className="mt-3 text-sm leading-6 text-secondary-600 dark:text-secondary-300">
            The app is designed for a clean local flow: create the product structure, upload architecture context, run the agent, and inspect the scored result.
          </p>
        </article>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title}>
              <div className="flex gap-4">
                <div className="glow-icon shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-secondary-950 dark:text-white">{section.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-secondary-600 dark:text-secondary-300">{section.body}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
