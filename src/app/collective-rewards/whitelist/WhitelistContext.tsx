import { BuilderStatus } from '@/app/collective-rewards/types'
import { createContext, Dispatch, FC, ReactNode, SetStateAction, useContext, useState } from 'react'
import {
  BuilderProposal,
  useGetFilteredBuilders,
} from '@/app/collective-rewards/whitelist/hooks/useGetFilteredBuilders'

export type BuilderStatusFilter = 'all' | BuilderStatus

type StateWithUpdate<T> = {
  value: T
  onChange: Dispatch<SetStateAction<T>>
}

interface WhitelistContextValue {
  builders: BuilderProposal[]
  isLoading: boolean
  error?: Error | null
  search: StateWithUpdate<string>
  filterBy: StateWithUpdate<BuilderStatusFilter>
}

const initialFilterByValue: BuilderStatusFilter = 'all'

export const WhitelistContext = createContext<WhitelistContextValue>({
  builders: [],
  isLoading: false,
  error: null,
  search: {
    value: '',
    onChange: () => {},
  },
  filterBy: {
    value: initialFilterByValue,
    onChange: () => {},
  },
})

interface WhitelistProviderProps {
  children: ReactNode
}

export const WhitelistContextProvider: FC<WhitelistProviderProps> = ({ children }) => {
  const [search, setSearch] = useState('')
  const [filterBy, setFilterBy] = useState<BuilderStatusFilter>(initialFilterByValue)
  const { data, isLoading, error } = useGetFilteredBuilders({ builderName: search, status: filterBy })

  const valueOfContext: WhitelistContextValue = {
    builders: data,
    isLoading,
    error,
    search: { value: search, onChange: setSearch },
    filterBy: { value: filterBy, onChange: setFilterBy },
  }

  return <WhitelistContext.Provider value={valueOfContext}>{children}</WhitelistContext.Provider>
}

export const useWhitelistContext = () => useContext(WhitelistContext)
