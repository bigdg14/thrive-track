export async function uploadImageDataUrl(dataUrl: string, filenamePrefix = "activity") {
  // If S3 isn't configured, return null so callers can fallback to storing data URL.
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    return null;
  }

  // Parse data URL
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) return null;
  const contentType = matches[1];
  const base64 = matches[2];
  const buffer = Buffer.from(base64, "base64");

  try {
    // Use eval to dynamically import so the bundler won't try to statically resolve the aws sdk when it's not installed.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const aws = await eval('import("@aws-sdk/client-s3")');
    const S3Client = aws.S3Client;
    const PutObjectCommand = aws.PutObjectCommand;

    const client = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } as any });

    const key = `${filenamePrefix}-${Date.now()}.${contentType.split("/")[1] || "bin"}`;

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: "public-read",
      })
    );

    // Construct public URL (user may override with custom domain)
    const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    return url;
  } catch (err) {
    console.error("S3 upload failed or @aws-sdk/client-s3 not installed", err);
    return null;
  }
}
