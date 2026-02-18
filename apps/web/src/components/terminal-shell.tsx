'use client'

import { useEffect, useRef } from 'react'
import { TRPCClientError } from '@trpc/client'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import { trpcClient } from '@/lib/trpc/client'

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
const EMAIL_PROMPT = '\x1b[38;2;255;229;146memail>\x1b[0m '
const NAME_PROMPT = '\x1b[38;2;255;229;146mname>\x1b[0m '
const CONTACT_EMAIL_PROMPT = '\x1b[38;2;255;229;146mcontact-email>\x1b[0m '
const MESSAGE_PROMPT = '\x1b[38;2;255;229;146mmessage>\x1b[0m '
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const terminalLink = (label: string, url: string) => `\x1b]8;;${url}\u0007${label}\x1b]8;;\u0007`

type AboutProfile = {
  bioPrefix: string
  company: {
    label: string
    url: string
  }
  links: {
    linkedin: string
    twitter: string
  }
}

type LoginResponse =
  | {
      ok: true
    }
  | {
      ok: false
      error: string
    }

type ContactResponse =
  | {
      ok: true
    }
  | {
      ok: false
      error: string
    }

type AboutResponse =
  | ({ ok: true } & AboutProfile)
  | {
      ok: false
      error: string
    }

type InputMode = 'command' | 'login-email' | 'contact-name' | 'contact-email' | 'contact-message'

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

    const getTrpcErrorMessage = (error: unknown, fallbackMessage: string) => {
      if (error instanceof TRPCClientError) {
        return error.message
      }

      if (error instanceof Error && error.message.trim().length > 0) {
        return error.message
      }

      return fallbackMessage
    }

    const requestMagicLink = async (email: string): Promise<LoginResponse> => {
      try {
        const response = await fetch('/api/auth/magic-link', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          cache: 'no-store',
          body: JSON.stringify({ email }),
        })

        let error = 'Unable to send magic link right now.'
        const json = (await response.json().catch(() => null)) as { error?: unknown } | null

        if (typeof json?.error === 'string' && json.error.trim().length > 0) {
          error = json.error
        }

        if (!response.ok) {
          return {
            ok: false,
            error,
          }
        }

        return { ok: true }
      } catch {
        return {
          ok: false,
          error: 'Network error while contacting auth endpoint.',
        }
      }
    }

    const requestAbout = async (): Promise<AboutResponse> => {
      try {
        const profile = await trpcClient.terminal.about.query()

        return { ok: true, ...profile }
      } catch (error) {
        return {
          ok: false,
          error: getTrpcErrorMessage(error, 'Could not load profile right now.'),
        }
      }
    }

    const requestContact = async (name: string, email: string, message: string): Promise<ContactResponse> => {
      try {
        await trpcClient.terminal.contact.mutate({
          name,
          email,
          message,
        })

        return { ok: true }
      } catch (error) {
        return {
          ok: false,
          error: getTrpcErrorMessage(error, 'Could not submit contact request right now.'),
        }
      }
    }

    const renderAbout = (profile: AboutProfile) => {
      writeLine('')
      writeLine('\x1b[1;38;2;154;243;255m/about\x1b[0m')
      writeLine(`${profile.bioPrefix}${terminalLink(profile.company.label, profile.company.url)}.`)
      writeLine('')
      writeLine(
        `${terminalLink('LinkedIn', profile.links.linkedin)} | ${terminalLink('Twitter', profile.links.twitter)}`,
      )
      writeLine('')
    }

    let inputMode: InputMode = 'command'
    let isRequestInFlight = false
    let contactName = ''
    let contactEmail = ''

    const writePrompt = () => {
      switch (inputMode) {
        case 'login-email':
          terminal.write(EMAIL_PROMPT)
          return
        case 'contact-name':
          terminal.write(NAME_PROMPT)
          return
        case 'contact-email':
          terminal.write(CONTACT_EMAIL_PROMPT)
          return
        case 'contact-message':
          terminal.write(MESSAGE_PROMPT)
          return
        default:
          terminal.write(PROMPT)
      }
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
      writeLine(
        '\x1b[38;2;165;210;255mType \x1b[1m/about\x1b[0m\x1b[38;2;165;210;255m or \x1b[1m/contact\x1b[0m\x1b[38;2;165;210;255m and press Enter.\x1b[0m',
      )
      writeLine('\x1b[38;2;123;149;187mUse /contact to send a message.\x1b[0m')
      writeLine('')
    }

    const handleLoginEmailInput = async (input: string) => {
      const email = input.trim().toLowerCase()

      if (!email) {
        writeLine('\x1b[38;2;255;162;162mEmail is required.\x1b[0m')
        writePrompt()
        return
      }

      if (!EMAIL_PATTERN.test(email)) {
        writeLine('\x1b[38;2;255;162;162mInvalid email format.\x1b[0m')
        writePrompt()
        return
      }

      isRequestInFlight = true
      writeLine('\x1b[38;2;157;241;199mSending magic link...\x1b[0m')

      const result = await requestMagicLink(email)
      isRequestInFlight = false

      if (result.ok) {
        writeLine(`\x1b[38;2;175;255;179mMagic link sent to ${email}\x1b[0m`)
        writeLine('\x1b[38;2;160;205;255mOpen the email and click the link to finish sign-in.\x1b[0m')
        writeLine('\x1b[38;2;160;205;255mAfter sign-in, you will land on /logged-in.\x1b[0m')
      } else {
        writeLine(`\x1b[38;2;255;162;162m${result.error}\x1b[0m`)
      }

      writeLine('')
      inputMode = 'command'
      writePrompt()
    }

    const handleAboutCommand = async () => {
      isRequestInFlight = true
      writeLine('\x1b[38;2;157;241;199mLoading profile...\x1b[0m')

      const result = await requestAbout()
      isRequestInFlight = false

      if (result.ok) {
        renderAbout(result)
      } else {
        writeLine(`\x1b[38;2;255;162;162m${result.error}\x1b[0m`)
        writeLine('')
      }

      writePrompt()
    }

    const startLoginFlow = () => {
      inputMode = 'login-email'
      writeLine('')
      writeLine('\x1b[1;38;2;255;236;167m/login\x1b[0m')
      writeLine('Enter your email for a passwordless magic link:')
      writePrompt()
    }

    const resetContactFlow = () => {
      contactName = ''
      contactEmail = ''
      inputMode = 'command'
    }

    const startContactFlow = () => {
      contactName = ''
      contactEmail = ''
      inputMode = 'contact-name'
      writeLine('')
      writeLine('\x1b[1;38;2;255;236;167m/contact\x1b[0m')
      writeLine("Drop me a quick note and I'll get back to you.")
      writePrompt()
    }

    const handleContactNameInput = (input: string) => {
      const name = input.trim()

      if (!name) {
        writeLine('\x1b[38;2;255;162;162mName is required.\x1b[0m')
        writePrompt()
        return
      }

      contactName = name
      inputMode = 'contact-email'
      writePrompt()
    }

    const handleContactEmailInput = (input: string) => {
      const email = input.trim().toLowerCase()

      if (!EMAIL_PATTERN.test(email)) {
        writeLine('\x1b[38;2;255;162;162mPlease provide a valid email.\x1b[0m')
        writePrompt()
        return
      }

      contactEmail = email
      inputMode = 'contact-message'
      writePrompt()
    }

    const handleContactMessageInput = async (input: string) => {
      const message = input.trim()

      if (message.length < 8) {
        writeLine('\x1b[38;2;255;162;162mMessage is too short. Add a bit more detail.\x1b[0m')
        writePrompt()
        return
      }

      isRequestInFlight = true
      writeLine('\x1b[38;2;157;241;199mSending message...\x1b[0m')

      const result = await requestContact(contactName, contactEmail, message)
      isRequestInFlight = false

      if (result.ok) {
        writeLine("\x1b[38;2;175;255;179mGot it. I'll follow up soon.\x1b[0m")
      } else {
        writeLine(`\x1b[38;2;255;162;162m${result.error}\x1b[0m`)
      }

      writeLine('')
      resetContactFlow()
      writePrompt()
    }

    const executeCommand = (input: string) => {
      const trimmedInput = input.trim()
      const [rawCommand] = trimmedInput.split(/\s+/, 1)
      const command = rawCommand?.toLowerCase() ?? ''

      if (!command) {
        writePrompt()
        return
      }

      if (command === '/about' || command === 'about') {
        void handleAboutCommand()
        return
      }

      if (command === '/login' || command === 'login') {
        startLoginFlow()
        return
      }

      if (command === '/contact' || command === 'contact') {
        startContactFlow()
        return
      }

      writeLine(`\x1b[38;2;255;144;144mcommand not found:\x1b[0m ${command}`)
      writeLine('\x1b[38;2;164;214;255mTry /about or /contact\x1b[0m')
      writeLine('')
      writePrompt()
    }

    const handleSubmittedInput = async (input: string) => {
      if (isRequestInFlight) {
        writeLine('\x1b[38;2;255;229;146mPlease wait for the current request to finish.\x1b[0m')
        writePrompt()
        return
      }

      switch (inputMode) {
        case 'login-email':
          await handleLoginEmailInput(input)
          return
        case 'contact-name':
          handleContactNameInput(input)
          return
        case 'contact-email':
          handleContactEmailInput(input)
          return
        case 'contact-message':
          await handleContactMessageInput(input)
          return
        default:
          executeCommand(input)
      }
    }

    writeBanner()

    let buffer = ''
    writePrompt()

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
          void handleSubmittedInput(command)
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
          resetContactFlow()
          writePrompt()
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
          <p className='text-[11px] tracking-[0.26em] text-[#8fd5ff] sm:text-xs'>SANTIAGO BUENAHORA</p>
        </header>
        <div className='h-[72vh] min-h-[480px] w-full bg-[radial-gradient(circle_at_8%_0%,rgba(127,255,192,0.08),transparent_35%),radial-gradient(circle_at_100%_100%,rgba(104,157,255,0.08),transparent_38%),#05080f] p-2 sm:p-4'>
          <div ref={containerRef} className='h-full w-full' />
        </div>
      </div>
    </section>
  )
}
