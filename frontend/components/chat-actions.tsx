import { PauseCircle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ChatHandler } from '@/lib/types';

export default function ChatActions(
  props: Pick<ChatHandler, 'stop' | 'reload'> & {
    showStop?: boolean;
    showReload?: boolean;
  }
) {
  return (
    <div className="space-x-8">
      <Button variant="outline" size="sm" onClick={props.stop} disabled={!props.showStop}>
        <PauseCircle className="mr-2 h-4 w-4" />
        Stop generating
      </Button>
      <Button variant="outline" size="sm" onClick={props.reload} disabled={!props.showReload}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Regenerate
      </Button>
    </div>
  );
}
