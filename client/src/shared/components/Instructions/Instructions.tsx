import styles from './Instructions.module.css';

type Props = {
  children: React.ReactNode;
  className?: string;
}

export const Instructions = ({ children, className = '' }: Props) => {
  return (
    <div className={[styles.instructions, className].join(' ')}>
      {children}
    </div>
  )
}