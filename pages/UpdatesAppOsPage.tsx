import React from 'react';
import DynamicPage from './DynamicPage';
import { ALL_GADGETS } from '../constants/gadgets';
import { CustomPage } from '../types';

interface UpdatesAppOsPageProps {
  pageId: string;
  isPdfMode?: boolean;
}

const PAGE_CONFIG: CustomPage = {
  "id": "custom-1771008387205",
  "name": "Updates OS / Apps",
  "icon": "ArrowBigUpDash",
  "queryIds": [
    "q-1771011026881",
    "q-1771011068176",
    "q-1771012209501"
  ],
  "columns": 12,
  "rowHeight": 220,
  "layout": [
    {
      "id": "row-1771011108262",
      "columnCount": 2,
      "height": 60,
      "cells": [
        {
          "id": "cell-1771011108262-0",
          "queryIds": [
            "q-1771011026881"
          ],
          "gridSpan": 3
        },
        {
          "id": "cell-1771011108262-1",
          "queryIds": [
            "q-1771011068176"
          ],
          "gridSpan": 3
        }
      ]
    },
    {
      "id": "row-1771012503707",
      "columnCount": 2,
      "height": 300,
      "cells": [
        {
          "id": "cell-1771012503707-0",
          "queryIds": [
            "q-1771012209501",
            "q-1771012305330"
          ],
          "gridSpan": 6
        },
        {
          "id": "cell-1771012503707-1",
          "queryIds": [
            "q-1771012410111",
            "q-1771012496236"
          ],
          "gridSpan": 6
        }
      ]
    }
  ],
  "fileName": ""
};

const UpdatesAppOsPage: React.FC<UpdatesAppOsPageProps> = ({ pageId, isPdfMode = false }) => {
  return <DynamicPage pageId={pageId} isPdfMode={isPdfMode} config={PAGE_CONFIG} allQueries={ALL_GADGETS} />;
};

export default UpdatesAppOsPage;
