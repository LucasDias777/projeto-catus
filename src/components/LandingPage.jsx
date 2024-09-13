import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Importa useNavigate
import styles from '../styles/LandingPage.module.css';

const LandingPage = () => {
  const navigate = useNavigate(); // Define a função navigate
  
  const [scrollPos, setScrollPos] = useState(0);
  const [prevScrollpos, setPrevScrollpos] = useState(window.pageYOffset);
  const handleRegisterClick = () => {
    navigate('/cadastro');
  };

  const handleScroll = () => {
    const currentScrollPos = window.pageYOffset;
    setScrollPos(currentScrollPos);

    const navbar = document.getElementById('navbar');
    if (currentScrollPos > 650) {
      navbar.style.backgroundColor = '#000';
    } else {
      navbar.style.backgroundColor = 'transparent';
    }

    if (prevScrollpos > currentScrollPos) {
      navbar.style.top = '0';
    } else {
      navbar.style.top = '-95px';
    }
    setPrevScrollpos(currentScrollPos);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [prevScrollpos]);

  return (
    <div className={styles.landingPageContainer}>
      <nav className={styles.landingPageNavbar} id="navbar">
        <ul>
          <a href="#" className={styles.logo}>StriveFlow</a>
          <li><a className={styles.navItem} href="#" onClick={() => navigate('/login')}>Login</a></li>
          <li><a className={styles.navItem} href="#" onClick={handleRegisterClick}>Cadastre-se</a></li>
          <li><a className={styles.navItem} href="#">Dragon</a></li>
          <li><a className={styles.navItem} href="#">Starship</a></li>
        </ul>
      </nav>

      <div className={styles.firstContent}>
        <div className={styles.firstText}>
          <p>COMEÇE AGORA</p>
          <h1>VENHA CONHECER<br />MOVIMENTE-SE</h1><br />
          <button className={styles.butt} onClick={() => navigate('/login')}>LOGIN</button>
        </div>
      </div>

      <div className={styles.secondContent}>
        <div className={styles.secondText}>
          <h1>RETURNING HUMAN<br />SPACEFLIGHT TO THE<br />UNITED STATES</h1><br />
          <button className={styles.butt}>LEARN MORE</button>
        </div>
      </div>

      <div className={styles.thirdContent}>
        <div className={styles.thirdText}>
          <h1>CREW DRAGON<br />DOCKING<br />SIMULATOR</h1>
          <p>Crew Dragon is designed to autonomously dock and undock with the International Space Station. However, the crew can take manual control of the spacecraft if necessary.</p><br />
          <button className={styles.butt}>TRY IT</button>
          <h1 className={styles.extraPadding}>gchgcgcgc,gchg<br />kchgchgckc<br />kgcmgcgcgc<br />gcnngfcx<br />mgcgcgk</h1>
        </div>
        <div className={styles.dragonDockVid}>
          <video
            src="/images/videotreino.mp4"
            controls
            autoPlay
            muted
            width="800"
            height="800"
            title="Dragon Docking Simulator"
          />
        </div>
      </div>

      <div className={styles.fourthContent}>
        <div className={styles.fourthText}>
          <h3>05/01/20</h3>
          <h1>NASA SELECTS LUNAR<br />OPTIMIZED STARSHIP</h1>
          <p>NASA selected SpaceX to develop a lunar optimized Starship to transport<br /> crew between lunar orbit and the surface of the Moon as part of NASA’s<br /> Artemis program.</p><br />
          <button className={styles.butt}>LEARN MORE</button>
        </div>
      </div>

      <footer>
        <ul className={styles.foot}>
          <li className={styles.author}>StriveFlow <i className="fa fa-copyright" aria-hidden="true"></i> 2024 by Direitos Reservados</li>
          <li><a href="#">TWITTER</a></li>
          <li><a href="#">YOUTUBE</a></li>
          <li><a href="#">INSTAGRAM</a></li>
          <li><a href="#">FLICKR</a></li>
          <li><a href="#">LINKEDIN</a></li>
          <li><a href="#">PRIVACY POLICY</a></li>
        </ul>
      </footer>
    </div>
  );
};

export default LandingPage;
