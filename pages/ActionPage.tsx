import React from 'react';
import DynamicPage from './DynamicPage';
<<<<<<< HEAD
=======
import { ALL_GADGETS } from '../constants/gadgets';
import { CustomPage } from '../types';
>>>>>>> 9dbf63b42a278be5cee40180ca73e7f55d957b4e

interface ActionPageProps {
  pageId?: string;
  isPdfMode?: boolean;
}

<<<<<<< HEAD
const ActionPage: React.FC<ActionPageProps> = ({ pageId = 'custom-1771946772035', isPdfMode = false }) => {
  return <DynamicPage pageId={pageId} isPdfMode={isPdfMode} />;
=======
const PAGE_CONFIG: CustomPage = {
  "id": "custom-1771946772035",
  "name": "Action",
  "icon": "Layout",
  "queryIds": [
    "q-1771952429199",
    "q-1771954745381"
  ],
  "columns": 12,
  "rowHeight": 220,
  "layout": [
    {
      "id": "row-1771954947093",
      "columnCount": 1,
      "height": 60,
      "cells": [
        {
          "id": "cell-1771954947093-0",
          "queryIds": [
            "q-1771952429199"
          ],
          "gridSpan": 3
        }
      ]
    },
    {
      "id": "row-1771954960431",
      "columnCount": 2,
      "height": 400,
      "cells": [
        {
          "id": "cell-1771954960431-0",
          "queryIds": [
            "q-1771954937854"
          ],
          "gridSpan": 4
        },
        {
          "id": "cell-1771954960431-1",
          "queryIds": [
            "q-1771954745381"
          ],
          "gridSpan": 8
        }
      ]
    }
  ],
  "fileName": "action"
};

const ActionPage: React.FC<ActionPageProps> = ({ pageId = 'custom-1771946772035', isPdfMode = false }) => {
  return <DynamicPage pageId={pageId} isPdfMode={isPdfMode} config={PAGE_CONFIG} allQueries={ALL_GADGETS} />;
>>>>>>> 9dbf63b42a278be5cee40180ca73e7f55d957b4e
};

export default ActionPage;
