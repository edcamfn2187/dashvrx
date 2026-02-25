import React from 'react';
import DynamicPage from './DynamicPage';
import { ALL_GADGETS } from '../constants/gadgets';
import { CustomPage } from '../types';

interface VisaoGeralPageProps {
  pageId: string;
  isPdfMode?: boolean;
}

const PAGE_CONFIG: CustomPage = {
  "id": "custom-1771604176722",
  "name": "Visão Geral",
  "icon": "LayoutDashboard",
  "queryIds": [
    "q-1770922994250",
    "q-connectivity",
    "q-1771946063571"
  ],
  "columns": 12,
  "rowHeight": 220,
  "layout": [
    {
      "id": "row-1771951999055",
      "columnCount": 4,
      "height": 60,
      "cells": [
        {
          "id": "cell-1771951999055-0",
          "queryIds": [
            "q-1771946063571"
          ],
          "gridSpan": 3
        },
        {
          "id": "cell-1771951999055-1",
          "queryIds": [
            "q-vulns"
          ],
          "gridSpan": 3
        },
        {
          "id": "cell-1771951999055-2",
          "queryIds": [
            "q-apps"
          ],
          "gridSpan": 3
        },
        {
          "id": "cell-1771952000509-3",
          "queryIds": [
            "q-1770944564773"
          ],
          "gridSpan": 3
        }
      ]
    },
    {
      "id": "row-1771952082465",
      "columnCount": 2,
      "height": 300,
      "cells": [
        {
          "id": "cell-1771952082465-0",
          "queryIds": [
            "q-1770924026797",
            "q-connectivity"
          ],
          "gridSpan": 4
        },
        {
          "id": "cell-1771952082465-1",
          "queryIds": [
            "q-1770922735256",
            "q-1770922994250"
          ],
          "gridSpan": 8
        }
      ]
    }
  ]
};

const VisaoGeralPage: React.FC<VisaoGeralPageProps> = ({ pageId, isPdfMode = false }) => {
  return <DynamicPage pageId={pageId} isPdfMode={isPdfMode} config={PAGE_CONFIG} allQueries={ALL_GADGETS} />;
};

export default VisaoGeralPage;
