const { assignLeadToLeastLoadedAgent } = require('../services/assignmentService');

describe('Auto Assignment Logic - Least Loaded Agent', () => {
  test('Should return the agent with the lowest active lead count', async () => {
    // Mock agents query
    const mockAgents = [
      { id: 'agent-1', name: 'Alice', role: 'AGENT', isActive: true },
      { id: 'agent-2', name: 'Bob', role: 'AGENT', isActive: true },
    ];

    // Mock count database calls
    const mockCount = jest.fn().mockImplementation((query) => {
      const assignedToId = query.where.assignedTo;
      if (assignedToId === 'agent-1') return Promise.resolve(5); // Agent 1 has 5 open leads
      if (assignedToId === 'agent-2') return Promise.resolve(2); // Agent 2 has 2 open leads
      return Promise.resolve(0);
    });

    // Mock tx transaction object
    const mockTx = {
      user: {
        findMany: jest.fn().mockResolvedValue(mockAgents),
      },
      lead: {
        count: mockCount,
      },
    };

    const assignedAgent = await assignLeadToLeastLoadedAgent(mockTx);
    
    expect(assignedAgent).toBeDefined();
    expect(assignedAgent.agentId).toEqual('agent-2');
    expect(assignedAgent.name).toEqual('Bob');
    expect(assignedAgent.count).toEqual(2);

    expect(mockTx.user.findMany).toHaveBeenCalled();
    expect(mockCount).toHaveBeenCalledTimes(2);
  });

  test('Should return null if no active agents are available', async () => {
    const mockTx = {
      user: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const assignedAgent = await assignLeadToLeastLoadedAgent(mockTx);
    expect(assignedAgent).toBeNull();
  });
});
