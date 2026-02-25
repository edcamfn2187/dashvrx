import React from 'react';
import DynamicPage from './DynamicPage';
<<<<<<< HEAD
=======
import { ALL_GADGETS } from '../constants/gadgets';
import { CustomPage } from '../types';
>>>>>>> 9dbf63b42a278be5cee40180ca73e7f55d957b4e

interface RecomendacoesPageProps {
  pageId?: string;
  isPdfMode?: boolean;
}

<<<<<<< HEAD
const RecomendacoesPage: React.FC<RecomendacoesPageProps> = ({ pageId = 'custom-1771947624811', isPdfMode = false }) => {
  return <DynamicPage pageId={pageId} isPdfMode={isPdfMode} />;
=======
const PAGE_CONFIG: CustomPage = {
  "id": "custom-1771947624811",
  "name": "Recomendações",
  "icon": "Zap",
  "queryIds": [],
  "columns": 12,
  "rowHeight": 220,
  "layout": [],
  "fileName": "recomendacoes"
};

const RecomendacoesPage: React.FC<RecomendacoesPageProps> = ({ pageId = 'custom-1771947624811', isPdfMode = false }) => {
  return <DynamicPage pageId={pageId} isPdfMode={isPdfMode} config={PAGE_CONFIG} allQueries={ALL_GADGETS} />;
>>>>>>> 9dbf63b42a278be5cee40180ca73e7f55d957b4e
};

export default RecomendacoesPage;
