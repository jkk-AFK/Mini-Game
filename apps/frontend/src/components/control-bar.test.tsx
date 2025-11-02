import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ControlBar } from './control-bar';

describe('ControlBar', () => {
  it('calls handlers when buttons clicked', () => {
    const onStart = vi.fn();
    const onPause = vi.fn();
    const onReset = vi.fn();
    const { getByText } = render(
      <ControlBar onStart={onStart} onPause={onPause} onReset={onReset} isRunning={false} />,
    );

    fireEvent.click(getByText('Start'));
    fireEvent.click(getByText('Pause'));
    fireEvent.click(getByText('Restart'));

    expect(onStart).toHaveBeenCalledOnce();
    expect(onPause).toHaveBeenCalledOnce();
    expect(onReset).toHaveBeenCalledOnce();
  });
});
