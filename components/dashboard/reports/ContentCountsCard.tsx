import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RefreshCw, Filter } from 'lucide-react'

// Static data can live here for now. We will filter it to show only page-related counts.
const contentData = [
  {
    type: 'Landing Page',
    language: 'en-us',
    domain: 'main-site.com',
    count: 142,
  },
  {
    type: 'Website Page',
    language: 'en-us',
    domain: 'main-site.com',
    count: 310,
  },
  {
    type: 'Blog Post',
    language: 'en-us',
    domain: 'blog.main-site.com',
    count: 78,
  },
  {
    type: 'Knowledge Article',
    language: 'en-us',
    domain: 'help.main-site.com',
    count: 256,
  },
  { type: 'Marketing Email', language: 'All', domain: 'N/A', count: 94 },
]

// Filtered data to only include specific page types as requested
const pageCountData = contentData.filter(item =>
  ['Landing Page', 'Website Page', 'Blog Post'].includes(item.type)
)

export const ContentCountsCard = () => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b bg-background/50">
        <div>
          <CardTitle>Page Counts</CardTitle>
          <CardDescription className="mt-1">An overview of your total page assets.</CardDescription>
        </div>
        <div className="flex items-center gap-4">
          {/* Filter button is hidden for now to simplify the UI */}
          {/*
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          */}

          {/* Last Updated Timestamp */}
          <div className="text-sm text-muted-foreground">
            Last Updated: <span className="font-medium">{new Date().toLocaleString()}</span>
          </div>

          <Button size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Page Type</TableHead>
              {/* The following columns are hidden to simplify the view */}
              {/* 
              <TableHead className="font-semibold">Language</TableHead>
              <TableHead className="font-semibold">Domain</TableHead>
              */}
              <TableHead className="text-right font-semibold">Total Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageCountData.map(item => (
              <TableRow key={item.type}>
                <TableCell className="font-medium">{item.type}</TableCell>
                {/* The following cells are hidden to simplify the view */}
                {/* 
                <TableCell>{item.language}</TableCell>
                <TableCell>{item.domain}</TableCell>
                */}
                <TableCell className="text-right font-medium">{item.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
