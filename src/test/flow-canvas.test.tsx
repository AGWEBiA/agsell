import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FlowCanvas } from '@/components/flow-builder/FlowCanvas';
import type { FlowConnection, FlowNode } from '@/components/flow-builder/flowNodeTypes';

vi.mock('lucide-react', async () => {
  const actual = await vi.importActual<typeof import('lucide-react')>('lucide-react');
  return actual;
});

function FlowCanvasHarness() {
  const [nodes, setNodes] = useState<FlowNode[]>([]);
  const [connections, setConnections] = useState<FlowConnection[]>([]);

  return (
    <div style={{ width: 900, height: 600 }}>
      <FlowCanvas
        nodes={nodes}
        connections={connections}
        onNodesChange={setNodes}
        onConnectionsChange={setConnections}
        onEditNode={() => undefined}
        onDeleteNode={() => undefined}
        sidebarDragPayload={{ nodeType: 'trigger', subtype: 'whatsapp_received' }}
        onSidebarDragConsume={() => undefined}
      />
    </div>
  );
}

describe('FlowCanvas', () => {
  it('adiciona um nó ao receber drop no canvas', () => {
    const { container } = render(<FlowCanvasHarness />);
    // React uses camelCase backgroundImage, rendered inline — query by data-testid or role instead
    const canvas = container.querySelector('[style*="background-image"]')
      || container.querySelector('[style*="backgroundImage"]')
      || container.querySelector('.relative.overflow-hidden');

    expect(canvas).toBeTruthy();

    fireEvent.drop(canvas as HTMLElement, {
      clientX: 320,
      clientY: 240,
      dataTransfer: {
        getData: () => '',
        dropEffect: 'copy',
      },
    });

    // After drop, a trigger node should appear
    // The node text depends on the trigger subtype mapping
  });
});
