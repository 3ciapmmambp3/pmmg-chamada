import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  if (year && month && day) return `${day}/${month}/${year}`
  return dateStr
}

export function toISODate(dateStr: string): string {
  if (!dateStr) return ''
  if (dateStr.includes('-')) return dateStr
  const [day, month, year] = dateStr.split('/')
  return `${year}-${month}-${day}`
}

export const POSTOS = [
  'Cel PM', 'Ten Cel PM', 'Maj PM', 'Cap PM',
  '1º Ten PM', '2º Ten PM', 'Asp Of PM',
  'Sub Ten PM', '1º Sgt PM', '2º Sgt PM', '3º Sgt PM',
  'Cb PM', 'SD PM',
]

export const PELOTOES = ['1º Pelotão', '2º Pelotão', '3º Pelotão', 'ADM']

export const GRUPAMENTOS = ['1º GP', '2º GP', '3º GP', '4º GP', '5º GP', 'ADM']

export const FUNCOES = [
  'Comandante', 'Subcomandante', 'Oficial de Dia',
  'Sgt de Dia', 'Patrulheiro', 'Motorista', 'Administrativo',
]
