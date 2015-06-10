<?php

	/**
	 * Used when someone tries to download the link
	 * @param  str $filename - This is the public facing download area
	 */
	public function download($new_filename = false)
	{

		$file = FileUpload::where('new_filename', $new_filename)->get();

		if ($file)
		{
			$filepath = Config::get('app.uploads') . $new_filename;

			$file = new Symfony\Component\HttpFoundation\File\File($filepath);
			$mime = $file->getMimeType();
			$size = $file->getSize();

			//need the raw file data
			$base_64 = File::get($filepath);

			return Response::stream(function() use($base_64) {
			  echo $base_64;
			}, 200, array('Content-Type' => $mime, 'Content-Length' => $size));

			//return Response::download(Config::get('app.uploads') . $new_filename);    
		} else {
			App::abort(401, 'Access denied');
		}

	}
