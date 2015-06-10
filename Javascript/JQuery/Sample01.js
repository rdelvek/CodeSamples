	$(document).ready(
	function(){

		$("#bulk-form").attr("action", "admins_bulk_edit");

		$("#submit-btn").on("click", function(e){
			e.preventDefault();
			doPost();
		});

		function doPost() {
			$.ajax({
			    url : $("#bulk-form").attr("action"),
			    type: "POST",
			    data : $("#bulk-form").serialize(),
				beforeSend: function() {
				 $('#loader').show();
				},
				complete: function(){
				 $('#loader').hide();
				},
			    success: function(data, textStatus, jqXHR)
			    {
			        if (data)
			        {
			        	$("#submit-btn").fadeOut();
			        	doAjax();
			        }else{

			        }
			        $("#submit-btn").fadeIn();	
			    },
			    error: function (jqXHR, textStatus, errorThrown)
			    {
			 
			    }
			});

		} //end doPost function

}); // end ready