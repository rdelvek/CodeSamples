<?php

	/**
	 * This method is used to return some initial data on page load
	 * @return [type] [description]
	 */
	public function file_uploader()
	{
		$posted_file_arr = Input::file('tmp');

		$data['uploaded_by'] = User::find( Auth::user()->id );
		$data['batch_id'] = app\helpers\StringHelper::gen_unique_id(20);

		if ($posted_file_arr) //if something posted
		{
			foreach ($posted_file_arr as $uploaded_file)
			{
				if ($uploaded_file != null)
				{
					$ext = $uploaded_file->getClientOriginalExtension();
					$orig_filename = $uploaded_file->getClientOriginalName(); // includes extension!

					// we need to remove bad chars from filenames (except periods!)
					
					$new_file_name = strtolower(preg_replace("/[^a-zA-Z0-9._]/", "", $orig_filename));

					$uploaded_file->move(Config::get('app.uploads'), $new_file_name );

					$data['orig_filename'] = $orig_filename;
					$data['new_hostname'] = URL::to('/download') . "/";
					$data['new_filename'] = $new_file_name;

					FileUpload::add_record($data);

					// @TODO: email the admin user when they complete an import
				}
			}

			return Redirect::route('admins_upload_complete', $data['batch_id']);
		}

		return View::make('admins.csv_upload_form', $this->data);

	}

