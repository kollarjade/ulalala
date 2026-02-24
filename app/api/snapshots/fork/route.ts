import { NextResponse } from 'next/server';
import { snapshotManager } from '@/lib/snapshot';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { projectId, parentManifestId } = await req.json();

  try {
    const newManifestId = await snapshotManager.createFork(projectId, parentManifestId);
    return NextResponse.json({ manifestId: newManifestId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
