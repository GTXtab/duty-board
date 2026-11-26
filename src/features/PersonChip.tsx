import type { Mark } from '../schedule/types';
import { personStyle } from './personStyle';

interface PersonChipProps {
  readonly name: string;
  readonly index: number;
  readonly mark?: Mark | null | undefined;
}

export const PersonChip = ({ name, index, mark }: PersonChipProps) => (
  <span
    className={mark === 'suggested' ? 'chip suggested' : 'chip'}
    style={personStyle(index)}
    title={mark === 'suggested' ? `${name}: за автоматичним планом` : name}
  >
    {mark === 'done' && <span aria-label="виконано">✓ </span>}
    {name}
  </span>
);
