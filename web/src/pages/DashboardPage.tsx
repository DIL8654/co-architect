import { useNavigate } from 'react-router-dom';
import { Button, Card, BuildingIcon, DocsIcon, HealthIcon, SettingsIcon, SparkIcon } from '../components';

export function DashboardPage() {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'Review architecture',
      description: 'Create an organization, workspace, and diagram, then run the Architecture Intelligence analysis.',
      icon: BuildingIcon,
      action: 'Open organizations',
      to: '/organizations',
    },
    {
      title: 'AI Foundry settings',
      description: 'Use your own Azure AI Foundry endpoint, agent, model deployment, and API key for local testing.',
      icon: SettingsIcon,
      action: 'Configure AI',
      to: '/settings',
    },
    {
      title: 'Infrastructure health',
      description: 'Check database, blob storage, and Azure Foundry connectivity before the demo flow.',
      icon: HealthIcon,
      action: 'Run health check',
      to: '/health',
    },
    {
      title: 'Product docs',
      description: 'Read the short in-app guide for what CoArchitect AI can do in this hackathon MVP.',
      icon: DocsIcon,
      action: 'Read docs',
      to: '/docs',
    },
  ];

  return (
    <div className="page-shell">
      <section className="page-header">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="glow-icon mb-4">
              <SparkIcon className="h-5 w-5" />
            </div>
            <h1 className="page-title">Architecture Intelligence Dashboard</h1>
            <p className="page-description mt-3">
              Run the local product flow against your cloud database, blob storage, and Azure AI Foundry agent without adding auth friction to the hackathon demo.
            </p>
          </div>
          <Button size="lg" onClick={() => navigate('/organizations')}>
            Start review
          </Button>
        </div>
      </section>

      <section className="entity-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="h-full">
              <div className="flex h-full flex-col gap-5">
                <div className="glow-icon">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-secondary-950 dark:text-white">{card.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-secondary-600 dark:text-secondary-300">{card.description}</p>
                </div>
                <Button variant="secondary" onClick={() => navigate(card.to)}>
                  {card.action}
                </Button>
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
