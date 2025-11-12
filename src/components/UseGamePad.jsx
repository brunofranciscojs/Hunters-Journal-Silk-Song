import { useEffect, useRef } from "react";

export function useGamepadForEnemies({ enemies, active, setActive, divRef, ativar, setPlay }) {
  const lastMoveRef = useRef(0);
  const lastAxisRef = useRef({ x: 0, y: 0 });
  const delay = 200; // ms entre movimentos

  useEffect(() => {
    let rafId;

    const handleGamepad = () => {
      const gamepads = navigator.getGamepads?.() || [];
      const gp = gamepads[0];

      if (!gp) {
        rafId = requestAnimationFrame(handleGamepad);
        return;
      }

      const now = Date.now();
      const isMobile = window.innerWidth < 1024;

      // Pega os eixos
      const lx = gp.axes[0] ?? 0;
      const ly = gp.axes[1] ?? 0;

      // Threshold para detectar movimento
      const threshold = 0.5;
      
      // Detecta se voltou ao centro (released)
      const axisReleased = Math.abs(lx) < 0.3 && Math.abs(ly) < 0.3;
      if (axisReleased) {
        lastAxisRef.current = { x: 0, y: 0 };
      }

      // Verifica se pode mover (delay + eixo foi liberado antes)
      const canMove = now - lastMoveRef.current >= delay && 
                      lastAxisRef.current.x === 0 && 
                      lastAxisRef.current.y === 0;

      let moved = false;

      if (canMove) {
        const currentIdx = enemies.findIndex((e) => e.slug === active);
        let newIdx = currentIdx === -1 ? 0 : currentIdx;

        if (isMobile) {
          // Mobile: scroll horizontal (2 linhas)
          const cols = Math.ceil(enemies.length / 2); // quantos itens por linha
          
          if (lx < -threshold) {
            // Left
            newIdx = Math.max(0, currentIdx - 1);
            moved = true;
            lastAxisRef.current.x = -1;
          } else if (lx > threshold) {
            // Right
            newIdx = Math.min(enemies.length - 1, currentIdx + 1);
            moved = true;
            lastAxisRef.current.x = 1;
          } else if (ly < -threshold) {
            // Up - pula pra linha de cima
            newIdx = currentIdx % 2 === 0 ? currentIdx : currentIdx - 1;
            moved = true;
            lastAxisRef.current.y = -1;
          } else if (ly > threshold) {
            // Down - pula pra linha de baixo
            newIdx = currentIdx % 2 === 0 ? currentIdx + 1 : currentIdx;
            newIdx = Math.min(enemies.length - 1, newIdx);
            moved = true;
            lastAxisRef.current.y = 1;
          }
        } else {
          // Desktop: scroll vertical (3 colunas)
          const cols = 3;
          
          if (ly < -threshold) {
            // Up
            newIdx = Math.max(0, currentIdx - cols);
            moved = true;
            lastAxisRef.current.y = -1;
          } else if (ly > threshold) {
            // Down
            newIdx = Math.min(enemies.length - 1, currentIdx + cols);
            moved = true;
            lastAxisRef.current.y = 1;
          } else if (lx < -threshold) {
            // Left
            newIdx = Math.max(0, currentIdx - 1);
            moved = true;
            lastAxisRef.current.x = -1;
          } else if (lx > threshold) {
            // Right
            newIdx = Math.min(enemies.length - 1, currentIdx + 1);
            moved = true;
            lastAxisRef.current.x = 1;
          }
        }

        if (moved && newIdx !== currentIdx) {
          lastMoveRef.current = now;
          const newEnemy = enemies[newIdx];
          setActive(newEnemy?.slug);

          // Scroll suave para o elemento
          const listItems = divRef.current?.querySelectorAll("li");
          const targetEl = listItems?.[newIdx];
          
          if (targetEl) {
            targetEl.scrollIntoView({ 
              behavior: "smooth", 
              block: "center", 
              inline: "center" 
            });
            
            // Chama o ativar automaticamente com o novo inimigo
            ativar(newEnemy.slug, targetEl);
          }
        }
      }

      // D-Pad como fallback
      const pressed = (i) => gp.buttons[i]?.pressed;
      if (canMove) {
        if (pressed(12)) { // D-pad Up
          handleDPad('up');
        } else if (pressed(13)) { // D-pad Down
          handleDPad('down');
        } else if (pressed(14)) { // D-pad Left
          handleDPad('left');
        } else if (pressed(15)) { // D-pad Right
          handleDPad('right');
        }
      }

      rafId = requestAnimationFrame(handleGamepad);
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
          
          // Chama o ativar automaticamente
          ativar(newEnemy.slug, targetEl);
        }
      }
    };

    rafId = requestAnimationFrame(handleGamepad);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [enemies, active, setActive, divRef, ativar]);
}