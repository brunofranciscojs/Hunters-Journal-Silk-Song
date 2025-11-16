import { useEffect, useRef } from "react";

export function useGamepadForEnemies({ enemies, active, setActive, divRef, ativar, setPlay, setMessage, message }) {
  const lastMoveRef = useRef(0);
  const lastAxisRef = useRef({ x: 0, y: 0 });
  const connectedShownRef = useRef(false);
  const wasConnectedRef = useRef(false);
  const gamepadActivatedRef = useRef(false); // ← NOVO
  const delay = 200;
  
  useEffect(() => {
    let rafId;
    let checkIntervalId;

    const checkGamepadStatus = () => {
      const gamepads = navigator.getGamepads?.() || [];
      const hasGamepad = gamepads.some((gp) => gp !== null);

      if (hasGamepad && !wasConnectedRef.current) {
        console.log('🎮 Gamepad CONECTADO');
        wasConnectedRef.current = true;
        showConnectedMessage();
      } else if (!hasGamepad && wasConnectedRef.current) {
        console.log('🎮 Gamepad DESCONECTADO');
        wasConnectedRef.current = false;
        connectedShownRef.current = false;
        setMessage(0);
      }
    };

    const handleGamepad = () => {
      const gamepads = navigator.getGamepads?.() || [];
      const gp = gamepads[gamepads[0] === null ? 1 : 0];

      if (!gp) {
        rafId = requestAnimationFrame(handleGamepad);
        return;
      }

      const now = Date.now();
      const isMobile = window.innerWidth < 1024;
      const lx = gp.axes[0] ?? 0;
      const ly = gp.axes[1] ?? 0;
      const threshold = 0.5;
      
      const axisReleased = Math.abs(lx) < 0.3 && Math.abs(ly) < 0.3;
      if (axisReleased) {
        lastAxisRef.current = { x: 0, y: 0 };
      }

      const canMove = now - lastMoveRef.current >= delay && 
                      lastAxisRef.current.x === 0 && 
                      lastAxisRef.current.y === 0;

      let moved = false;

      if (canMove) {
        const currentIdx = enemies.findIndex((e) => e.slug === active);
        let newIdx = currentIdx === -1 ? 0 : currentIdx;

        if (isMobile) {
          const cols = Math.ceil(enemies.length / 2);
          
          if (lx < -threshold) {
            newIdx = Math.max(0, currentIdx - 1);
            moved = true;
            lastAxisRef.current.x = -1;
          } else if (lx > threshold) {
            newIdx = Math.min(enemies.length - 1, currentIdx + 1);
            moved = true;
            lastAxisRef.current.x = 1;
          } else if (ly < -threshold) {
            newIdx = currentIdx % 2 === 0 ? currentIdx : currentIdx - 1;
            moved = true;
            lastAxisRef.current.y = -1;
          } else if (ly > threshold) {
            newIdx = currentIdx % 2 === 0 ? currentIdx + 1 : currentIdx;
            newIdx = Math.min(enemies.length - 1, newIdx);
            moved = true;
            lastAxisRef.current.y = 1;
          }
        } else {
          const cols = 3;
          
          if (ly < -threshold) {
            newIdx = Math.max(0, currentIdx - cols);
            moved = true;
            lastAxisRef.current.y = -1;
          } else if (ly > threshold) {
            newIdx = Math.min(enemies.length - 1, currentIdx + cols);
            moved = true;
            lastAxisRef.current.y = 1;
          } else if (lx < -threshold) {
            newIdx = Math.max(0, currentIdx - 1);
            moved = true;
            lastAxisRef.current.x = -1;
          } else if (lx > threshold) {
            newIdx = Math.min(enemies.length - 1, currentIdx + 1);
            moved = true;
            lastAxisRef.current.x = 1;
          }
        }

        if (moved && newIdx !== currentIdx) {
          lastMoveRef.current = now;
          const newEnemy = enemies[newIdx];
          setActive(newEnemy?.slug);

          const listItems = divRef.current?.querySelectorAll("li");
          const targetEl = listItems?.[newIdx];
          
          if (targetEl) {
            targetEl.scrollIntoView({ 
              behavior: "smooth", 
              block: "center", 
              inline: "center" 
            });
            
            ativar(newEnemy.slug, targetEl);
          }
        }
      }

      const pressed = (i) => gp.buttons[i]?.pressed;
      if (canMove) {
        if (pressed(12)) handleDPad('up');
        else if (pressed(13)) handleDPad('down');
        else if (pressed(14)) handleDPad('left');
        else if (pressed(15)) handleDPad('right');
      }
      
      rafId = requestAnimationFrame(handleGamepad);
    };

    const showConnectedMessage = () => {
      if (!connectedShownRef.current) {
        setMessage(1);
        connectedShownRef.current = true;
        setTimeout(() => {
          console.log('⏰ Ocultando mensagem após 5s');
          setMessage(0);
        }, 5000);
      }
    };

    const onGamepadConnected = (e) => {
      console.log('🎮 Evento gamepadconnected:', e.gamepad.id);
      wasConnectedRef.current = true;
      showConnectedMessage();
    };

    const onGamepadDisconnected = (e) => {
      console.log('🎮 Evento gamepaddisconnected:', e.gamepad.id);
      wasConnectedRef.current = false;
      connectedShownRef.current = false;
      setMessage(0);
    };

    const handleDPad = (direction) => {
      const isMobile = window.innerWidth < 1024;
      const currentIdx = enemies.findIndex((e) => e.slug === active);
      let newIdx = currentIdx === -1 ? 0 : currentIdx;

      if (isMobile) {
        if (direction === 'left') newIdx = Math.max(0, currentIdx - 1);
        if (direction === 'right') newIdx = Math.min(enemies.length - 1, currentIdx + 1);
        if (direction === 'up') newIdx = currentIdx % 2 === 0 ? currentIdx : currentIdx - 1;
        if (direction === 'down') {
          newIdx = currentIdx % 2 === 0 ? currentIdx + 1 : currentIdx;
          newIdx = Math.min(enemies.length - 1, newIdx);
        }
      } else {
        const cols = 3;
        if (direction === 'up') newIdx = Math.max(0, currentIdx - cols);
        if (direction === 'down') newIdx = Math.min(enemies.length - 1, currentIdx + cols);
        if (direction === 'left') newIdx = Math.max(0, currentIdx - 1);
        if (direction === 'right') newIdx = Math.min(enemies.length - 1, currentIdx + 1);
      }

      if (newIdx !== currentIdx) {
        lastMoveRef.current = Date.now();
        lastAxisRef.current.x = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;
        lastAxisRef.current.y = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
        
        const newEnemy = enemies[newIdx];
        setActive(newEnemy?.slug);
        
        const listItems = divRef.current?.querySelectorAll("li");
        const targetEl = listItems?.[newIdx];
        if (targetEl) {
          targetEl.scrollIntoView({ 
            behavior: "smooth", 
            block: "center", 
            inline: "center" 
          });
          
          ativar(newEnemy.slug, targetEl);
        }
      }
    };

    // ✅ ATIVA GAMEPAD API COM INTERAÇÃO DO USUÁRIO
    const activateGamepad = () => {
      if (!gamepadActivatedRef.current) {
        console.log('👆 Ativando Gamepad API após interação do usuário');
        gamepadActivatedRef.current = true;
        
        // Força leitura dos gamepads
        const gps = navigator.getGamepads?.() || [];
        console.log('🎮 Gamepads após ativação:', gps.length, gps);
        
        // Verifica se tem gamepad conectado
        checkGamepadStatus();
      }
    };

    // ✅ Escuta QUALQUER interação do usuário
    window.addEventListener('click', activateGamepad, { once: true });
    window.addEventListener('keydown', activateGamepad, { once: true });
    window.addEventListener('touchstart', activateGamepad, { once: true });
    window.addEventListener('gamepadconnected', onGamepadConnected);
    window.addEventListener('gamepaddisconnected', onGamepadDisconnected);

    // Polling contínuo
    checkIntervalId = setInterval(checkGamepadStatus, 500);
    
    // Verifica imediatamente
    checkGamepadStatus();

    // Inicia loop
    rafId = requestAnimationFrame(handleGamepad);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (checkIntervalId) clearInterval(checkIntervalId);
      window.removeEventListener('click', activateGamepad);
      window.removeEventListener('keydown', activateGamepad);
      window.removeEventListener('touchstart', activateGamepad);
      window.removeEventListener('gamepadconnected', onGamepadConnected);
      window.removeEventListener('gamepaddisconnected', onGamepadDisconnected);
    };
  }, [enemies, active, setActive, divRef, ativar, setMessage]);
}