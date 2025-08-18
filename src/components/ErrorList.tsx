import { Textarea } from '@/components/ui/textarea';

type props = {
  content: string;
};

const ErrorList = ({ content }: props) => {
  return (
    <div className="grid grid-cols-12 col-span-2 gap-4">
      <Textarea
        style={{ gridColumn: 'span 12 / span 12' }}
        disabled
        value={content}
        className="textarea-query min-h-auto resize-y"
      ></Textarea>
    </div>
  );
};

export default ErrorList;
