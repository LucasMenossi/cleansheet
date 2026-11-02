
import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
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
    render(<DataPreview dataset={dataset} pageIndex={0} onPageChange={() => {}} />)

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
    render(<DataPreview dataset={dataset} pageIndex={0} onPageChange={() => {}} />)

    expect(screen.getByText('2 linhas')).toBeInTheDocument()
    expect(screen.getByText('2 colunas')).toBeInTheDocument()
  })

  it('paginates large datasets and navigates to a highlighted record', () => {
    const largeDataset: Dataset = {
      ...dataset,
      rows: Array.from({ length: 205 }, (_, index) => ({
        id: `row-${index + 1}`,
        values: { Nome: `Pessoa ${index + 1}`, Cidade: 'Curitiba' },
      })),
    };

    function PaginationHarness() {
      const [pageIndex, setPageIndex] = useState(2)
      return (
        <DataPreview
          dataset={largeDataset}
          highlightedRowIds={['row-205']}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
        />
      )
    }

    render(<PaginationHarness />)

    expect(screen.getByText('Exibindo 201–205 de 205')).toBeInTheDocument()
    expect(screen.getByText('Pessoa 205')).toBeInTheDocument()
    expect(screen.queryByText('Pessoa 1')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(screen.getByText('Pessoa 101')).toBeInTheDocument()
    expect(screen.queryByText('Pessoa 205')).not.toBeInTheDocument()
  })
})
