import React from 'react';
import DynamicPage from './DynamicPage';
import { ALL_GADGETS } from '../constants/gadgets';
import { CustomPage } from '../types';

interface DadosCvesPageProps {
  pageId: string;
  isPdfMode?: boolean;
}

const PAGE_CONFIG: CustomPage = {
  "id": "custom-1771604533538",
  "name": "Dados de CVEs",
  "icon": "ShieldAlert",
  "queryIds": [],
  "columns": 12,
  "rowHeight": 220,
  "layout": [
    {
      "id": "row-1771604555699",
      "columnCount": 5,
      "height": 60,
      "cells": [
        {
          "id": "cell-1771604555699-0",
          "queryIds": [
            "q-1770923040050"
          ],
          "gridSpan": 2
        },
        {
          "id": "cell-1771604555699-1",
          "queryIds": [
            "q-cve-critical"
          ],
          "gridSpan": 2.5
        },
        {
          "id": "cell-1771604555699-2",
          "queryIds": [
            "q-cve-high"
          ],
          "gridSpan": 2.5
        },
        {
          "id": "cell-1771604556891-3",
          "queryIds": [
            "q-cve-medium"
          ],
          "gridSpan": 2.5
        },
        {
          "id": "cell-1771604557917-4",
          "queryIds": [
            "q-cve-low"
          ],
          "gridSpan": 2.5
        }
      ]
    },
    {
      "id": "row-1771604637711",
      "columnCount": 3,
      "height": 300,
      "cells": [
        {
          "id": "cell-1771604637711-0",
          "queryIds": [
            "q-1770948885069"
          ],
          "gridSpan": 3.5
        },
        {
          "id": "cell-1771604637711-1",
          "queryIds": [
            "q-cve-product-severity"
          ],
          "gridSpan": 3.5
        },
        {
          "id": "cell-1771604715304-2",
          "queryIds": [
            "q-1770954616169",
            "q-1770987066354"
          ],
          "gridSpan": 5
        }
      ]
    }
  ]
};

const DadosCvesPage: React.FC<DadosCvesPageProps> = ({ pageId, isPdfMode = false }) => {
  return <DynamicPage pageId={pageId} isPdfMode={isPdfMode} config={PAGE_CONFIG} allQueries={ALL_GADGETS} />;
};

export default DadosCvesPage;
