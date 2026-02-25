import React from 'react';
import DynamicPage from './DynamicPage';
import { ALL_GADGETS } from '../constants/gadgets';
import { CustomPage } from '../types';

interface CompliancePageProps {
  pageId: string;
  isPdfMode?: boolean;
}

const PAGE_CONFIG: CustomPage = {
  "id": "custom-1771605045950",
  "name": "Compliance",
  "icon": "BarChart3",
  "queryIds": [
    "q-1771723881418"
  ],
  "columns": 12,
  "rowHeight": 220,
  "layout": [
    {
      "id": "row-1771723209273",
      "columnCount": 2,
      "height": 300,
      "cells": [
        {
          "id": "cell-1771723209274-0",
          "queryIds": [
            "q-1771723201985"
          ],
          "gridSpan": 4
        },
        {
          "id": "cell-1771723209274-1",
          "queryIds": [
            "q-1771722966647"
          ],
          "gridSpan": 8
        }
      ]
    },
    {
      "id": "row-1771723886303",
      "columnCount": 1,
      "height": 300,
      "cells": [
        {
          "id": "cell-1771723886303-0",
          "queryIds": [
            "q-1771723881418"
          ],
          "gridSpan": 6
        }
      ]
    }
  ]
};

const CompliancePage: React.FC<CompliancePageProps> = ({ pageId, isPdfMode = false }) => {
  return <DynamicPage pageId={pageId} isPdfMode={isPdfMode} config={PAGE_CONFIG} allQueries={ALL_GADGETS} />;
};

export default CompliancePage;
