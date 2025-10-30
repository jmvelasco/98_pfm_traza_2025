import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LineageNode } from '../components/traceability/LineageNode';
import type { TimelineEntry } from '../types/traceability';

describe('LineageNode Component', () => {
  describe('TransferEvent Display', () => {
    it('should display product name in transfer amount text', () => {
      // RED Test: This will FAIL because current implementation shows "100 units transferred"
      // but we want "100 units of Organic Wheat transferred"
      
      const mockTransferEntry: TimelineEntry = {
        type: 'transfer',
        timestamp: 1698668400000, // Oct 30, 2023
        tokenInfo: {
          tokenId: 1,
          parentId: 0,
          name: 'Organic Wheat',
          creator: '0x1234567890123456789012345678901234567890',
          creatorRole: 'Producer',
          createdAt: 1698668400000,
          level: 0,
          currentBalance: 50,
          totalSupply: 100,
          features: '{"origin": "Farm A", "organic": true}'
        },
        transferInfo: {
          transferId: 1,
          tokenId: 1,
          from: '0x1234567890123456789012345678901234567890',
          fromRole: 'Producer',
          to: '0x9876543210987654321098765432109876543210',
          toRole: 'Factory',
          amount: 100,
          timestamp: 1698668400000,
          status: 'Accepted'
        }
      };

      render(<LineageNode entry={mockTransferEntry} />);

      // Expect the new format with product name
      expect(screen.getByText('100 units of Organic Wheat transferred')).toBeInTheDocument();
    });

    it('should display product name with special characters correctly', () => {
      const mockTransferEntry: TimelineEntry = {
        type: 'transfer',
        timestamp: 1698668400000,
        tokenInfo: {
          tokenId: 2,
          parentId: 0,
          name: 'Premium Coffee Beans (Arabica)',
          creator: '0x1234567890123456789012345678901234567890',
          creatorRole: 'Producer',
          createdAt: 1698668400000,
          level: 0,
          currentBalance: 25,
          totalSupply: 50,
          features: '{"variety": "arabica", "premium": true}'
        },
        transferInfo: {
          transferId: 2,
          tokenId: 2,
          from: '0x1234567890123456789012345678901234567890',
          fromRole: 'Producer',
          to: '0x9876543210987654321098765432109876543210',
          toRole: 'Factory',
          amount: 50,
          timestamp: 1698668400000,
          status: 'Accepted'
        }
      };

      render(<LineageNode entry={mockTransferEntry} />);

      expect(screen.getByText('50 units of Premium Coffee Beans (Arabica) transferred')).toBeInTheDocument();
    });
  });
});