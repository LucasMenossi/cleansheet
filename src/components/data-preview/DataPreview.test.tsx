
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DataPreview } from './DataPreview'
import type { Dataset } from '../../features/dataset/types'

const dataset: Dataset = {
  columns: [
    { id: 'col-name', name: 'Nome' },
    { id: 'col-city', name: 'Cidade' },
  ],
  rows: [
    {
      id: 'row-1',
      values: { Nome: 'Lucas', Cidade: 'Curitiba' },
    },
    {
      id: 'row-2',
      values: { Nome: 'Ana', Cidade: 'Londrina' },
    },
  ],
}

describe('DataPreview', () => {
  it('renders column headers and values', () => {
    render(<DataPreview dataset={dataset} />)

    expect(
      screen.getByRole('columnheader', { name: 'Nome' }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('columnheader', { name: 'Cidade' }),
    ).toBeInTheDocument()

    const table = screen.getByRole('table')

    expect(within(table).getByText('Lucas')).toBeInTheDocument()
    expect(within(table).getByText('Curitiba')).toBeInTheDocument()
    expect(within(table).getByText('Ana')).toBeInTheDocument()
    expect(within(table).getByText('Londrina')).toBeInTheDocument()
  })

  it('displays row and column counts', () => {
    render(<DataPreview dataset={dataset} />)

    expect(screen.getByText('2 linhas')).toBeInTheDocument()
    expect(screen.getByText('2 colunas')).toBeInTheDocument()
  })
})
