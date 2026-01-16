import React from 'react';
import { useToolbarStore } from '../../stores/toolbarStore';
import {
  HomeToolbar,
  InsertToolbar,
  FormulasToolbar,
  DataToolbar,
  ReviewToolbar,
  ViewToolbar,
  PageLayoutToolbar,
} from './toolbars';

export const Toolbar2026: React.FC = () => {
  const { activeTab } = useToolbarStore();

  const renderToolbar = () => {
    switch (activeTab) {
      case 'home':
        return <HomeToolbar />;
      case 'insert':
        return <InsertToolbar />;
      case 'page-layout':
        return <PageLayoutToolbar />;
      case 'formulas':
        return <FormulasToolbar />;
      case 'data':
        return <DataToolbar />;
      case 'review':
        return <ReviewToolbar />;
      case 'view':
        return <ViewToolbar />;
      default:
        return <HomeToolbar />;
    }
  };

  return renderToolbar();
};
