import React from 'react';
import DynamicPage from './DynamicPage';

interface TestPagePageProps {
  pageId?: string;
  isPdfMode?: boolean;
}

const TestPagePage: React.FC<TestPagePageProps> = ({ pageId = 'custom-1771984151015', isPdfMode = false }) => {
  return <DynamicPage pageId={pageId} isPdfMode={isPdfMode} />;
};

export default TestPagePage;
