import SecurityStatePage from './SecurityStatePage';

interface AppStatusStateProps {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}

export function AppLoadingState({
  title = 'Chargement',
  description = 'Chargement en cours...',
  actionHref = '#home',
  actionLabel = 'Retour à l’accueil',
}: Partial<AppStatusStateProps>) {
  return <SecurityStatePage title={title} description={description} actionHref={actionHref} actionLabel={actionLabel} />;
}

export function AppErrorState({
  title = 'Une erreur est survenue',
  description = 'Le contenu est temporairement indisponible.',
  actionHref = '#home',
  actionLabel = 'Retour à l’accueil',
}: Partial<AppStatusStateProps>) {
  return <SecurityStatePage title={title} description={description} actionHref={actionHref} actionLabel={actionLabel} />;
}
