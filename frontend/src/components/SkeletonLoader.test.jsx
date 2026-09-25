import React from 'react';
import { render } from '@testing-library/react';
import SkeletonLoader from './SkeletonLoader';

describe('SkeletonLoader Component', () => {
  it('renders correctly with default props', () => {
    const { container } = render(<SkeletonLoader />);
    const loader = container.firstChild;
    
    expect(loader).toBeInTheDocument();
    expect(loader).toHaveStyle('width: 100%');
    expect(loader).toHaveStyle('height: 20px');
    expect(loader).toHaveStyle('border-radius: 4px');
  });

  it('renders correctly with custom props', () => {
    const { container } = render(<SkeletonLoader width="50%" height="40px" borderRadius="10px" className="custom-class" />);
    const loader = container.firstChild;
    
    expect(loader).toHaveStyle('width: 50%');
    expect(loader).toHaveStyle('height: 40px');
    expect(loader).toHaveStyle('border-radius: 10px');
    expect(loader).toHaveClass('custom-class');
  });
});
