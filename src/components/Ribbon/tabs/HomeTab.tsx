import React from 'react';
import { ClipboardGroup } from '../groups/ClipboardGroup';
import { FontGroup } from '../groups/FontGroup';
import { AlignmentGroup } from '../groups/AlignmentGroup';
import { NumberGroup } from '../groups/NumberGroup';
import { StylesGroup } from '../groups/StylesGroup';
import { CellsGroup } from '../groups/CellsGroup';
import { EditingGroup } from '../groups/EditingGroup';

export const HomeTab: React.FC = () => {
  return (
    <div className="ribbon-tab-content home-tab">
      <ClipboardGroup />
      <div className="ribbon-separator" />
      <FontGroup />
      <div className="ribbon-separator" />
      <AlignmentGroup />
      <div className="ribbon-separator" />
      <NumberGroup />
      <div className="ribbon-separator" />
      <StylesGroup />
      <div className="ribbon-separator" />
      <CellsGroup />
      <div className="ribbon-separator" />
      <EditingGroup />
    </div>
  );
};
