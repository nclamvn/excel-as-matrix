import React from 'react';
import { RibbonGroup } from '../RibbonGroup';
import { RibbonButton } from '../RibbonButton';
import {
  AlignLeft, AlignCenter, AlignRight,
  RotateCw, Indent, Outdent
} from 'lucide-react';
import { useFormatStore } from '../../../stores/formatStore';

export const AlignmentGroup: React.FC = () => {
  const { align, setAlign } = useFormatStore();

  return (
    <RibbonGroup label="Alignment" showDialogLauncher>
      <div className="alignment-group-layout">
        {/* Row 1: Orientation (placeholder) */}
        <div className="alignment-row">
          <RibbonButton icon={RotateCw} label="Orientation" />
        </div>

        {/* Row 2: Horizontal alignment + Indent */}
        <div className="alignment-row">
          <RibbonButton
            icon={AlignLeft}
            label="Align Left"
            active={align === 'left'}
            onClick={() => setAlign('left')}
          />
          <RibbonButton
            icon={AlignCenter}
            label="Center"
            active={align === 'center'}
            onClick={() => setAlign('center')}
          />
          <RibbonButton
            icon={AlignRight}
            label="Align Right"
            active={align === 'right'}
            onClick={() => setAlign('right')}
          />
          <RibbonButton
            icon={Outdent}
            label="Decrease Indent"
          />
          <RibbonButton
            icon={Indent}
            label="Increase Indent"
          />
        </div>
      </div>
    </RibbonGroup>
  );
};
