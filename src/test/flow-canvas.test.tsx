import React, { useState } from 'react';
import { render } from '@testing-library/react';
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
  it('renders without crashing', () => {
    const { container } = render(<FlowCanvasHarness />);
    expect(container).toBeTruthy();
    // FlowCanvas relies on DOM dimensions (refs) which are not available in JSDOM,
    // so we verify it mounts without errors
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });
});
