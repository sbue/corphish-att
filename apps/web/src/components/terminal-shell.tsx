'use client'

import { useEffect, useRef } from 'react'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'

type TerminalShellProps = {
  initialCommand?: string
}

const SANTIAGO_ASCII = [
  ' ####   ###   #   #  #####  #####   ###    ####   ###',
  '#      #   #  ##  #    #      #    #   #  #      #   #',
  ' ###   #####  # # #    #      #    #####  #  ##  #   #',
  '    #  #   #  #  ##    #      #    #   #  #   #  #   #',
  '####   #   #  #   #    #    #####  #   #   ####   ###',
]

const BUENAHORA_ASCII = [
  '####   #   #  #####  #   #   ###   #   #   ###   ####    ###',
  '#   #  #   #  #      ##  #  #   #  #   #  #   #  #   #  #   #',
  '####   #   #  ####   # # #  #####  #####  #   #  ####   #####',
  '#   #  #   #  #      #  ##  #   #  #   #  #   #  #  #   #   #',
  '####    ###   #####  #   #  #   #  #   #   ###   #   #  #   #',
]

const PROMPT = '\x1b[38;2;138;255;201mvisitor@buenahora\x1b[0m:\x1b[38;2;127;171;255m~\x1b[0m$ '

const ABOUT_PLACEHOLDER = [
  '',
  '\x1b[1;38;2;154;243;255m/about\x1b[0m',
  'Santiago placeholder bio.',
  'This output will move to a server-side tRPC command later.',
  '',
  'Suggested fields:',
  '  - current focus',
  '  - key projects',
  '  - contact links',
  '',
]

export function TerminalShell({ initialCommand }: TerminalShellProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    const terminal = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontFamily: '"JetBrains Mono", "IBM Plex Mono", "Fira Code", monospace',
      fontSize: 14,
      lineHeight: 1.35,
      letterSpacing: 0.3,
      theme: {
        background: '#05080f',
        foreground: '#dbf5ff',
        cursor: '#9dffce',
        selectionBackground: '#274f6b',
        black: '#151a2b',
        red: '#ff6f93',
        green: '#8bff8a',
        yellow: '#ffe58f',
        blue: '#79beff',
        magenta: '#d89bff',
        cyan: '#72f5ff',
        white: '#e8f4ff',
        brightBlack: '#5f6f93',
        brightRed: '#ff94ae',
        brightGreen: '#bcff9f',
        brightYellow: '#fff1b5',
        brightBlue: '#9fd3ff',
        brightMagenta: '#ebc2ff',
        brightCyan: '#a2f6ff',
        brightWhite: '#ffffff',
      },
    })
    const fitAddon = new FitAddon()

    terminal.loadAddon(fitAddon)
    terminal.open(containerRef.current)
    fitAddon.fit()

    const onResize = () => fitAddon.fit()
    window.addEventListener('resize', onResize)

    const writeLine = (value = '') => {
      terminal.write(`${value}\r\n`)
    }

    const writeBanner = () => {
      const santigoColors = [
        '38;2;162;255;119',
        '38;2;145;255;163',
        '38;2;142;233;255',
        '38;2;167;196;255',
        '38;2;205;184;255',
      ]
      const buenahoraColors = [
        '38;2;125;216;255',
        '38;2;119;231;255',
        '38;2;143;246;255',
        '38;2;162;238;229',
        '38;2;179;255;189',
      ]

      writeLine('\x1b[38;2;88;118;173m+---------------------------------------------------------------------+\x1b[0m')
      for (const [index, line] of SANTIAGO_ASCII.entries()) {
        writeLine(`\x1b[${santigoColors[index]}m${line}\x1b[0m`)
      }
      writeLine('\x1b[38;2;88;118;173m+---------------------------------------------------------------------+\x1b[0m')
      for (const [index, line] of BUENAHORA_ASCII.entries()) {
        writeLine(`\x1b[${buenahoraColors[index]}m${line}\x1b[0m`)
      }
      writeLine('\x1b[38;2;88;118;173m+---------------------------------------------------------------------+\x1b[0m')
      writeLine('')
      writeLine('\x1b[38;2;165;210;255mType \x1b[1m/about\x1b[0m\x1b[38;2;165;210;255m and press Enter.\x1b[0m')
      writeLine('\x1b[38;2;123;149;187mOnly /about is implemented for now.\x1b[0m')
      writeLine('')
    }

    const executeCommand = (input: string) => {
      const command = input.trim().toLowerCase()

      if (!command) {
        terminal.write(PROMPT)
        return
      }

      if (command === '/about' || command === 'about') {
        for (const line of ABOUT_PLACEHOLDER) {
          writeLine(line)
        }
        terminal.write(PROMPT)
        return
      }

      writeLine(`\x1b[38;2;255;144;144mcommand not found:\x1b[0m ${command}`)
      writeLine('\x1b[38;2;164;214;255mTry /about\x1b[0m')
      writeLine('')
      terminal.write(PROMPT)
    }

    writeBanner()

    let buffer = ''
    terminal.write(PROMPT)

    const bootCommand = initialCommand?.trim()
    if (bootCommand) {
      terminal.write(`${bootCommand}\r\n`)
      executeCommand(bootCommand)
      buffer = ''
    }

    const disposable = terminal.onData((data) => {
      if (data.startsWith('\u001b')) {
        return
      }

      for (const char of data) {
        if (char === '\r') {
          terminal.write('\r\n')
          const command = buffer
          buffer = ''
          executeCommand(command)
          continue
        }

        if (char === '\u007f') {
          if (buffer.length > 0) {
            buffer = buffer.slice(0, -1)
            terminal.write('\b \b')
          }
          continue
        }

        if (char === '\u0003') {
          terminal.write('^C\r\n')
          buffer = ''
          terminal.write(PROMPT)
          continue
        }

        if (char >= ' ') {
          buffer += char
          terminal.write(char)
        }
      }
    })

    return () => {
      disposable.dispose()
      window.removeEventListener('resize', onResize)
      terminal.dispose()
    }
  }, [initialCommand])

  return (
    <section className='relative w-full'>
      <div className='pointer-events-none absolute inset-0 rounded-3xl border border-[#2b4566]/80 shadow-[0_0_100px_rgba(90,165,255,0.18)]' />
      <div className='relative overflow-hidden rounded-3xl border border-[#30537a] bg-[#05080f]/95'>
        <header className='flex items-center justify-between border-b border-[#24476b] bg-[linear-gradient(120deg,#071321,#13283e)] px-4 py-3'>
          <div className='flex items-center gap-2'>
            <span className='h-2.5 w-2.5 rounded-full bg-[#ff6e8e]' />
            <span className='h-2.5 w-2.5 rounded-full bg-[#ffd975]' />
            <span className='h-2.5 w-2.5 rounded-full bg-[#84f8a2]' />
          </div>
          <p className='text-[11px] tracking-[0.26em] text-[#8fd5ff] sm:text-xs'>BUENAHORA TERMINAL</p>
        </header>
        <div className='h-[72vh] min-h-[480px] w-full bg-[radial-gradient(circle_at_8%_0%,rgba(127,255,192,0.08),transparent_35%),radial-gradient(circle_at_100%_100%,rgba(104,157,255,0.08),transparent_38%),#05080f] p-2 sm:p-4'>
          <div ref={containerRef} className='h-full w-full' />
        </div>
      </div>
    </section>
  )
}
