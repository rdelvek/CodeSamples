        /*
         * GET: This method is called to force a download on the media file (pdf) based on the passed GUID of the media item
         * Example: /Search/DownloadMediaItem/{89810FE1-9490-4CEA-A750-5653BF28017B}
         */
        [HttpGet]
        public ActionResult DownloadMediaItem(string MediaItemGuid)
        {
            using (new Sitecore.SecurityModel.SecurityDisabler()) //since this will be a public site - no login required
            {
                if (Sitecore.Data.ID.IsID(MediaItemGuid))  // check if this is a valid GUID?
                {
                    Item SitecoreItem = Sitecore.Context.Database.GetItem(Sitecore.Data.ID.Parse(MediaItemGuid));

                    if (SitecoreItem != null)
                    {
                        MediaItem MediaItem = new MediaItem(SitecoreItem);
                        string Filename = MediaItem.Name + "." + MediaItem.Extension;

                        Response.Clear();
                        Response.ContentType = MediaItem.MimeType;
                        Response.AppendHeader("Content-Disposition", string.Format("attachment;filename=\"{0}\"", Filename));
                        Response.StatusCode = (int)HttpStatusCode.OK;
                        Response.BufferOutput = true;
                        MediaItem.GetMediaStream().CopyTo(Response.OutputStream); // Copy the media stream to the response output stream
                        Response.Flush();
                        Response.End();
                    }
                    else
                    {
                        throw new HttpException(404, "Invalid Sitecore Item");
                    }
                }
                else
                {
                    throw new HttpException(404, "GUID Improperly Formatted");
                }
            }

            return null;
        }
