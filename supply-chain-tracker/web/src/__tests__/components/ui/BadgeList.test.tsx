import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BadgeList } from '../../components/ui/BadgeList';

describe('BadgeList', () => {
  describe('notes type', () => {
    it('should render parsed notes as badges', () => {
      render(<BadgeList data="Original: 1500, transferidos: 500" type="notes" />);

      // Check badges are rendered
      expect(screen.getByText('Original')).toBeInTheDocument();
      expect(screen.getByText('transferidos')).toBeInTheDocument();

      // Check values are formatted
      expect(screen.getByText('1,500')).toBeInTheDocument();
      expect(screen.getByText('500')).toBeInTheDocument();
    });

    it('should handle empty notes gracefully', () => {
      render(<BadgeList data="" type="notes" />);

      // Should show empty fallback
      expect(screen.getByText('')).toBeInTheDocument();
    });

    it('should fall back to original text for unparseable data', () => {
      const unparseable = 'Some random text without format';
      render(<BadgeList data={unparseable} type="notes" />);

      expect(screen.getByText(unparseable)).toBeInTheDocument();
    });
  });

  describe('distribution type', () => {
    it('should render parsed distribution as badges', () => {
      render(
        <BadgeList data="Producer: 200 + Factory: 400 + Procesado: 400" type="distribution" />
      );

      // Check role badges
      expect(screen.getByText('Producer')).toBeInTheDocument();
      expect(screen.getByText('Factory')).toBeInTheDocument();
      expect(screen.getByText('Procesado')).toBeInTheDocument();

      // Check values
      expect(screen.getByText('200')).toBeInTheDocument();
      expect(screen.getByText('400')).toBeInTheDocument();
    });

    it('should apply default card styles for regular items', () => {
      render(<BadgeList data="Producer: 100" type="distribution" />);

      const cardContainer = screen.getByText('Producer:').closest('div');
      expect(cardContainer).toHaveClass('bg-gray-50', 'border-gray-200', 'rounded-lg');
    });

    it('should apply processed styles for processed items', () => {
      render(<BadgeList data="Procesado: 300" type="distribution" />);

      const processedLabel = screen.getByText('Procesado:');
      expect(processedLabel).toHaveClass('text-blue-700', 'italic');

      const cardContainer = processedLabel.closest('div');
      expect(cardContainer).toHaveClass('bg-blue-50', 'border-blue-200');
    });

    it('should handle numbers with commas', () => {
      render(<BadgeList data="Producer: 1,500" type="distribution" />);

      expect(screen.getByText('Producer')).toBeInTheDocument();
      expect(screen.getByText('1,500')).toBeInTheDocument();
    });
  });

  describe('responsive behavior', () => {
    it('should have responsive width classes', () => {
      render(<BadgeList data="Producer: 100" type="distribution" />);

      const container = screen.getByText('Producer:').closest('div')?.parentElement;
      expect(container).toHaveClass(
        'min-w-[220px]',
        'max-w-[320px]',
        'md:max-w-[380px]',
        'lg:max-w-[420px]'
      );
    });
  });

  describe('accessibility', () => {
    it('should have proper spacing between items', () => {
      render(<BadgeList data="Producer: 100 + Factory: 200" type="distribution" />);

      const container = screen.getByText('Producer:').closest('div')?.parentElement;
      expect(container).toHaveClass('space-y-2.5');
    });

    it('should have tabular numbers for values', () => {
      render(<BadgeList data="Producer: 100" type="distribution" />);

      const valueElement = screen.getByText('100');
      expect(valueElement).toHaveClass('tabular-nums');
    });
  });
});
