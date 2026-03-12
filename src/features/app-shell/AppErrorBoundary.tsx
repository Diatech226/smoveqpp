import { Component, type ReactNode } from 'react';
import SecurityStatePage from './SecurityStatePage';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <SecurityStatePage
          title="Erreur d'initialisation"
          description="Le runtime applicatif a rencontré une erreur. Rechargez la page."
          actionHref="#home"
          actionLabel="Retour à l'accueil"
        />
      );
    }

    return this.props.children;
  }
}
