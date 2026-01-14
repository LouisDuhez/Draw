import styles from './DrawLayout.module.css';

type DrawLayoutProps = {
  children?: React.ReactNode;
  topArea?: React.ReactNode;
  rightArea?: React.ReactNode;
  bottomArea?: React.ReactNode;
};

export function DrawLayout({topArea, bottomArea, rightArea, children}: DrawLayoutProps) {
  return (
    <div className={styles.drawLayout}>
      {topArea && 
        <div className={styles.drawLayout__top}>
        {topArea}
        </div>
      }
      <div className={styles.drawLayout__content}>
        {children}
      </div>
      <div className={styles.drawLayout__right}>
        {rightArea}
      </div>
      <div className={styles.drawLayout__bottom}>
        {bottomArea}
      </div>
    </div>
  )
}