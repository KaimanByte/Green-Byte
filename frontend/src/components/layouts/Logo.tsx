import logo from '../../assets/logo-greenbyte.svg'
import styles from './Logo.module.css'

export function Logo() {
  return (
    <img
      className={styles.logo}
      src={logo}
      alt="GreenByte · Monitoramento ambiental"
      draggable={false}
    />
  )
}
