import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';

export default function Home() {
  return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-2xl mx-auto p-8 text-center">
          <div className="bg-white rounded-lg shadow-lg p-12">
            <div className="flex justify-center mb-6">
              <div className="bg-primary/10 p-4 rounded-full">
                <Building2 className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Hệ thống Quản lý Gia sư
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Nền tảng quản lý trung tâm gia sư và đánh giá chất lượng dịch vụ
            </p>
            <Link href="/admin/centers">
              <Button size="lg" className="gap-2">
                <Building2 className="h-5 w-5" />
                Quản lý Trung tâm
              </Button>
            </Link>
          </div>
        </div>
      </div>
  );
}
